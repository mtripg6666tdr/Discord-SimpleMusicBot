/*
 * Copyright 2021-2024 mtripg6666tdr
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
import type { GuildBGMContainerType } from "./config";
import type * as discord from "oceanic.js";

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { HttpBackupper } from "./Component/backupper/httpBased";
import { MongoBackupper } from "./Component/backupper/mongodb";
import { ReplitBackupper } from "./Component/backupper/replit";
import { InteractionCollectorManager } from "./Component/collectors/InteractionCollectorManager";
import { RateLimitController } from "./Component/rateLimitController";
import { SourceCache } from "./Component/sourceCache";
import { GuildDataContainer } from "./Structure";
import { LogEmitter } from "./Structure";
import { GuildDataContainerWithBgm } from "./Structure/GuildDataContainerWithBgm";
import * as Util from "./Util";
import { getConfig } from "./config";

export type DataType = Map<string, GuildDataContainer>;

interface BotBaseEvents {
  beforeReady: [];
  ready: [];
  onMessageCreate: [message:discord.Message];
  onInteractionCreate: [interaction:discord.Interaction];
  onCommandHandler: [command:BaseCommand, args:CommandArgs];
  onBotVoiceChannelJoin: [channel:discord.VoiceChannel|discord.StageChannel];
  guildDataAdded: [container:GuildDataContainer];
  guildDataRemoved: [guildId:string];
  tick: [count:number];
}

/**
 * 音楽ボットの本体のうち、カスタムデータ構造を実装します
 */
export abstract class MusicBotBase extends LogEmitter<BotBaseEvents> {
  // クライアントの初期化
  protected readonly abstract _client: discord.Client;
  protected readonly _instantiatedTime: Date | null = null;
  protected readonly _versionInfo: string;
  protected readonly _rateLimitController = new RateLimitController();
  protected readonly guildData: DataType = new Map();
  protected readonly _interactionCollectorManager: InteractionCollectorManager = new InteractionCollectorManager();
  protected readonly _cacheManger: SourceCache;
  protected _backupper: Backupper | null = null;
  private maintenanceTickCount = 0;

  /**
   * クライアント
   */
  get client() {
    return this._client;
  }

  /**
   * インタラクションコレクター
   */
  get collectors() {
    return this._interactionCollectorManager;
  }

  /**
   * キャッシュマネージャー
   */
  get cache() {
    return this._cacheManger;
  }

  /**
   * バックアップ管理クラス
   */
  get backupper() {
    return this._backupper;
  }

  /**
   * バージョン情報  
   * (リポジトリの最終コミットのハッシュ値)
   */
  get version() {
    return this._versionInfo;
  }

  /**
   * 初期化された時刻
   */
  get instantiatedTime() {
    return this._instantiatedTime;
  }

  get databaseCount() {
    return this.guildData.size;
  }

  get connectingGuildCount() {
    return [...this.guildData.values()].filter(guild => guild.player.isConnecting).length;
  }

  get playingGuildCount() {
    return [...this.guildData.values()].filter(guild => guild.player.isPlaying).length;
  }

  get pausedGuildCount() {
    return [...this.guildData.values()].filter(guild => guild.player.isPaused).length;
  }

  get totalTransformingCost() {
    return [...this.guildData.values()]
      .map(d => d.player.cost)
      .reduce((prev, current) => prev + current, 0)
    ;
  }

  get rateLimitController(): Readonly<RateLimitController> {
    return this._rateLimitController;
  }

  constructor(protected readonly maintenance: boolean = false) {
    super("Main");
    this._instantiatedTime = new Date();
    this.logger.info("bot is instantiated");
    if (maintenance) {
      this.logger.info("bot is now maintainance mode");
    }

    const versionObtainStrategies = [
      () => {
        if (fs.existsSync(path.join(__dirname, "../DOCKER_BUILD_IMAGE"))) {
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
      },
    ];
    for (let i = 0; i < versionObtainStrategies.length; i++) {
      try {
        this._versionInfo = versionObtainStrategies[i]();
      }
      catch { /* empty */ }
      if (this._versionInfo) break;
    }
    if (!this._versionInfo) {
      this._versionInfo = "Could not get version";
    }
    this.logger.info(`Version: ${this._versionInfo}`);
    this.initializeBackupper();
    const config = getConfig();
    this._cacheManger = new SourceCache(this, config.cacheLevel === "persistent");
  }

  /**
   * バックアップ用のコンポーネントを、環境設定から初期化します。
   */
  private initializeBackupper() {
    if (MongoBackupper.backuppable) {
      this._backupper = new MongoBackupper(this, () => this.guildData);
    } else if (ReplitBackupper.backuppable) {
      this._backupper = new ReplitBackupper(this, () => this.guildData);
    } else if (HttpBackupper.backuppable) {
      this._backupper = new HttpBackupper(this, () => this.guildData);
    }
  }

  /**
   * ボットのデータ整理等のメンテナンスをするためのメインループ。約一分間隔で呼ばれます。
   */
  protected maintenanceTick() {
    this.maintenanceTickCount++;
    this.logger.debug(`[Tick] #${this.maintenanceTickCount}`);
    this.emit("tick", this.maintenanceTickCount);
    // 4分ごとに主要情報を出力
    if (this.maintenanceTickCount % 4 === 1) this.logGeneralInfo();
  }

  /**
   *  定期ログを実行します
   */
  logGeneralInfo() {
    const guildDataArray = [...this.guildData.values()];
    const memory = Util.system.getMemoryInfo();
    this.logger.info(
      `[Tick] (Client) Participating: ${this._client.guilds.size}, Registered: ${this.guildData.size} Connecting: ${guildDataArray.filter(d => d.player.isConnecting).length} Paused: ${guildDataArray.filter(d => d.player.isPaused).length}`
    );
    this.logger.info(
      `[Tick] (System) Free:${Math.floor(memory.free)}MB; Total:${Math.floor(memory.total)}MB; Usage:${memory.usage}%`
    );
    const nMem = process.memoryUsage();
    const rss = Util.system.getMBytes(nMem.rss);
    const ext = Util.system.getMBytes(nMem.external);
    this.logger.info(
      `[Tick] (System) Memory RSS: ${rss}MB, Heap total: ${Util.system.getMBytes(nMem.heapTotal)}MB, Total: ${Util.getPercentage(rss + ext, memory.total)}%`
    );
  }

  abstract run(debugLog: boolean, debugLogStoreLength?: number): void;

  /**
   * 必要に応じてサーバーデータを初期化します
   */
  protected upsertData(guildid: string, boundChannelId: string) {
    const prev = this.guildData.get(guildid);
    if (!prev) {
      const config = getConfig();
      const server = config.bgm[guildid]
        ? new GuildDataContainerWithBgm(guildid, boundChannelId, this, config.bgm[guildid])
        : new GuildDataContainer(guildid, boundChannelId, this);
      this.guildData.set(guildid, server);
      this.emit("guildDataAdded", server);
      return server;
    } else {
      return prev;
    }
  }

  protected initDataWithBgm(guildid: string, boundChannelId: string, bgmConfig: GuildBGMContainerType) {
    if (this.guildData.has(guildid)) throw new Error("guild data was already set");
    const server = new GuildDataContainerWithBgm(guildid, boundChannelId, this, bgmConfig);
    this.guildData.set(guildid, server);
    this.emit("guildDataAdded", server);
    return server;
  }

  resetData(guildId: string) {
    this.guildData.delete(guildId);
    this.emit("guildDataRemoved", guildId);
  }

  getData(guildId: string) {
    return this.guildData.get(guildId);
  }
}
