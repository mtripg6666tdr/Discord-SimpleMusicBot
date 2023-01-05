/*
 * Copyright 2021-2022 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

import type { BaseCommand, CommandArgs } from "./Commands";
import type { Backupper } from "./Component/backupper";
import type { GuildBGMContainerType } from "./Util/config";
import type * as discord from "eris";

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { PageToggle } from "./Component/PageToggle";
import { RateLimitController } from "./Component/RateLimitController";
import { HttpBackupper } from "./Component/backupper/httpBased";
import { MongoBackupper } from "./Component/backupper/mongodb";
import { GuildDataContainer } from "./Structure";
import { LogEmitter } from "./Structure";
import { GuildDataContainerWithBgm } from "./Structure/GuildDataContainerWithBgm";
import { Util } from "./Util";

export type DataType = Map<string, GuildDataContainer>;

/**
 * 音楽ボットの本体のうち、カスタムデータ構造を実装します
 */
export abstract class MusicBotBase extends LogEmitter {
  // クライアントの初期化
  protected readonly abstract _client:discord.Client;
  protected readonly _instantiatedTime:Date = null;
  protected readonly _versionInfo:string = null;
  protected readonly _embedPageToggle:PageToggle[] = [];
  protected readonly _rateLimitController = new RateLimitController();
  protected readonly guildData:DataType = new Map();
  protected _backupper:Backupper = null;
  private maintenanceTickCount = 0;
  /**
   * ページトグル
   */
  get toggles(){
    return this._embedPageToggle;
  }

  /**
   * クライアント
   */
  get client(){
    return this._client;
  }
  
  /**
   * バックアップ管理クラス
   */
  get backupper(){
    return this._backupper;
  }

  /**
   * バージョン情報  
   * (リポジトリの最終コミットのハッシュ値)
   */
  get version(){
    return this._versionInfo;
  }

  /**
   * 初期化された時刻
   */
  get instantiatedTime(){
    return this._instantiatedTime;
  }

  get databaseCount(){
    return this.guildData.size;
  }

  get totalTransformingCost(){
    return [...this.guildData.keys()]
      .map(id => this.guildData.get(id).player.cost)
      .reduce((prev, current) => prev + current, 0)
    ;
  }

  constructor(protected readonly maintenance:boolean = false){
    super();
    this.setTag("Main");
    this._instantiatedTime = new Date();
    this.Log("bot is instantiated");
    if(maintenance){
      this.Log("bot is now maintainance mode");
    }
    
    const versionObtainStrategies = [
      () => {
        if(fs.existsSync(path.join(__dirname, "../DOCKER_BUILD_IMAGE"))){
          return require("../package.json").version;
        }
      },
      () => {
        return execSync("git tag --points-at HEAD")
          .toString()
          .trim()
        ;
      },
      () => {
        return execSync("git log -n 1 --pretty=format:%h")
          .toString()
          .trim()
        ;
      }
    ];
    for(let i = 0; i < versionObtainStrategies.length; i++){
      try{
        this._versionInfo = versionObtainStrategies[i]();
      }
      catch{ /* empty */ }
      if(this._versionInfo) break;
    }
    if(!this._versionInfo){
      this._versionInfo = "Could not get version";
    }
    this.Log(`Version: ${this._versionInfo}`);
    this.initializeBackupper();
  }

  private initializeBackupper(){
    if(MongoBackupper.backuppable){
      this._backupper = new MongoBackupper(this, () => this.guildData);
    }else if(HttpBackupper.backuppable){
      this._backupper = new HttpBackupper(this, () => this.guildData);
    }
  }

  /**
   * ボットのデータ整理等のメンテナンスをするためのメインループ。約一分間隔で呼ばれます。
   */
  protected maintenanceTick(){
    this.maintenanceTickCount++;
    Util.logger.log(`[Tick] #${this.maintenanceTickCount}`, "debug");
    this.emit("tick", this.maintenanceTickCount);
    // ページトグルの整理
    PageToggle.organize(this._embedPageToggle, 5);
    // 4分ごとに主要情報を出力
    if(this.maintenanceTickCount % 4 === 1) this.logGeneralInfo();
  }

  /**
   *  定期ログを実行します
   */
  logGeneralInfo(){
    const _d = Object.values(this.guildData);
    const memory = Util.system.GetMemInfo();
    Util.logger.log(`[Tick] [Main] Participating: ${this._client.guilds.size}, Registered: ${this.guildData.size} Connecting: ${_d.filter(info => info.player.isPlaying).length} Paused: ${_d.filter(__d => __d.player.isPaused).length}`);
    Util.logger.log(`[Tick] [System] Free:${Math.floor(memory.free)}MB; Total:${Math.floor(memory.total)}MB; Usage:${memory.usage}%`);
    const nMem = process.memoryUsage();
    const rss = Util.system.GetMBytes(nMem.rss);
    const ext = Util.system.GetMBytes(nMem.external);
    Util.logger.log(`[Tick] [Main] Memory RSS: ${rss}MB, Heap total: ${Util.system.GetMBytes(nMem.heapTotal)}MB, Total: ${Util.math.GetPercentage(rss + ext, memory.total)}%`);
  }

  abstract run(debugLog:boolean, debugLogStoreLength?:number):void;

  /**
   * 必要に応じてサーバーデータを初期化します
   */
  protected initData(guildid:string, boundChannelId:string){
    const prev = this.guildData.get(guildid);
    if(!prev){
      const server = new GuildDataContainer(guildid, boundChannelId, this);
      this.guildData.set(guildid, server);
      this.emit("guildDataAdded", server);
      return server;
    }else{
      return prev;
    }
  }

  protected initDataWithBgm(guildid:string, boundChannelId:string, bgmConfig:GuildBGMContainerType){
    if(this.guildData.has(guildid)) throw new Error("guild data was already set");
    const server = new GuildDataContainerWithBgm(guildid, boundChannelId, this, bgmConfig);
    this.guildData.set(guildid, server);
    this.emit("guildDataAdded", server);
    return server;
  }

  resetData(guildId:string){
    this.guildData.delete(guildId);
    this.emit("guildDataRemoved", guildId);
  }

  override emit<T extends keyof BotBaseEvents>(eventName:T, ...args:BotBaseEvents[T]){
    return super.emit(eventName, ...args);
  }

  override on<T extends keyof BotBaseEvents>(eventName:T, listener: (...args:BotBaseEvents[T]) => void){
    return super.on(eventName, listener);
  }

  override once<T extends keyof BotBaseEvents>(eventName:T, listener: (...args:BotBaseEvents[T]) => void){
    return super.on(eventName, listener);
  }

  override off<T extends keyof BotBaseEvents>(eventName:T, listener: (...args:BotBaseEvents[T]) => void){
    return super.off(eventName, listener);
  }
}

interface BotBaseEvents {
  beforeReady:[];
  ready:[];
  onMessageCreate:[message:discord.Message];
  onInteractionCreate:[interaction:discord.Interaction];
  onCommandHandler:[command:BaseCommand, args:CommandArgs];
  onBotVoiceChannelJoin:[channel:discord.VoiceChannel];
  guildDataAdded:[container:GuildDataContainer];
  guildDataRemoved:[guildId:string];
  tick:[count:number];
}
