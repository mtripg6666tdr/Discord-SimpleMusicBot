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

import type * as discord from "eris";

import { execSync } from "child_process";

import { BackUpper } from "./Component/Backupper";
import { PageToggle } from "./Component/PageToggle";
import { GuildDataContainer } from "./Structure";
import { LogEmitter } from "./Structure";
import { Util } from "./Util";

export type DataType = {[key:string]:GuildDataContainer};

/**
 * 音楽ボットの本体のうち、カスタムデータ構造を実装します
 */
export abstract class MusicBotBase extends LogEmitter {
  // クライアントの初期化
  protected readonly abstract _client:discord.Client;
  protected readonly _instantiatedTime:Date = null;
  protected readonly _versionInfo:string = "Could not get info";
  protected readonly _embedPageToggle:PageToggle[] = [];
  protected readonly _backupper = new BackUpper(() => this.data);
  protected readonly data:DataType = {};
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
    return Object.keys(this.data).length;
  }

  get totalTransformingCost(){
    return Object.keys(this.data)
      .map(id => this.data[id].player.cost)
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
    try{
      this._versionInfo = execSync("git log -n 1 --pretty=format:%h").toString()
        .trim();
      this.Log(`Version: ${this._versionInfo}`);
    }
    catch{
      this.Log("Something went wrong when obtaining version", "warn");
    }
  }

  /**
   * ボットのデータ整理等のメンテナンスをするためのメインループ。約一分間隔で呼ばれます。
   */
  protected maintenanceTick(){
    this.maintenanceTickCount++;
    Util.logger.log(`[Tick] #${this.maintenanceTickCount}`, "debug");
    // ページトグルの整理
    PageToggle.organize(this._embedPageToggle, 5);
    // 4分ごとに主要情報を出力
    if(this.maintenanceTickCount % 4 === 1) this.logGeneralInfo();
    if(this.maintenanceTickCount % 2 === 1) this._backupper.backupData();
  }

  /**
   *  定期ログを実行します
   */
  logGeneralInfo(){
    const _d = Object.values(this.data);
    const memory = Util.system.GetMemInfo();
    Util.logger.log(`[Tick] [Main] Participating: ${this._client.guilds.size}, Registered: ${Object.keys(this.data).length} Connecting: ${_d.filter(info => info.player.isPlaying).length} Paused: ${_d.filter(__d => __d.player.isPaused).length}`);
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
  protected initData(guildid:string, channelid:string){
    const prev = this.data[guildid];
    if(!prev){
      const server = this.data[guildid] = new GuildDataContainer(guildid, channelid, this);
      return server;
    }else{
      return prev;
    }
  }

  resetData(guildId:string){
    delete this.data[guildId];
    this.backupper.addModifiedGuilds(guildId);
  }
}
