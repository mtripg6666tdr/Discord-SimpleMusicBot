import type { PageToggle } from "./Component/PageToggle";
import type * as discord from "eris";

import { execSync } from "child_process";

import { GuildDataContainer } from "./Structure";
import { LogEmitter } from "./Structure";
import { Util } from "./Util";

/**
 * 音楽ボットの本体のうち、カスタムデータ構造を実装します
 */
export abstract class MusicBotBase extends LogEmitter {
  // クライアントの初期化
  protected readonly abstract _client:discord.Client;
  protected readonly _instantiatedTime = null as Date;
  protected readonly _versionInfo = "Could not get info" as string;
  protected readonly _embedPageToggle = [] as PageToggle[];
  protected _queueModifiedGuilds = [] as string[];
  protected readonly data = {} as {[key:string]:GuildDataContainer};
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
   * キューが変更されたサーバーの保存
   */
  get queueModifiedGuilds(){
    return this._queueModifiedGuilds;
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
    this.SetTag("Main");
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
   *  定期ログを実行します
   */
  logGeneralInfo(){
    const _d = Object.values(this.data);
    const memory = Util.system.GetMemInfo();
    Util.logger.log(`[Main]Participating: ${this._client.guilds.size}, Registered: ${Object.keys(this.data).length} Connecting: ${_d.filter(info => info.player.isPlaying).length} Paused: ${_d.filter(__d => __d.player.isPaused).length}`);
    Util.logger.log(`[System]Free:${Math.floor(memory.free)}MB; Total:${Math.floor(memory.total)}MB; Usage:${memory.usage}%`);
    const nMem = process.memoryUsage();
    const rss = Util.system.GetMBytes(nMem.rss);
    const ext = Util.system.GetMBytes(nMem.external);
    Util.logger.log(`[Main]Memory RSS: ${rss}MB, Heap total: ${Util.system.GetMBytes(nMem.heapTotal)}MB, Total: ${Util.math.GetPercentage(rss + ext, memory.total)}% (use systeminfo command for more info)`);
  }

  abstract run(debugLog:boolean, debugLogStoreLength?:number):void;

  /**
   * 接続ステータスやキューを含む全データをサーバーにバックアップします
   */
  async backupData(){
    if(Util.db.DatabaseAPI.CanOperate){
      const t = Util.time.timer.start("MusicBot#BackupData");
      try{
        this.backupStatus();
        // キューの送信
        const queue = [] as {guildid:string, queue:string}[];
        const guilds = this._queueModifiedGuilds;
        guilds.forEach(id => {
          queue.push({
            guildid: id,
            queue: this.data[id].exportQueue()
          });
        });
        if(queue.length > 0){
          await Util.db.DatabaseAPI.SetQueueData(queue);
        }else{
          Util.logger.log("[Backup] No modified queue found, skipping");
        }
        this._queueModifiedGuilds = [];
      }
      catch(e){
        this.Log(e, "warn");
      }
      t.end();
    }
  }

  /**
   * 接続ステータス等をサーバーにバックアップします
   */
  backupStatus(){
    const t = Util.time.timer.start("MusicBot#BackupStatus");
    try{
      // 参加ステータスの送信
      const speaking = [] as {guildid:string, value:string}[];
      Object.keys(this.data).forEach(id => {
        speaking.push({
          guildid: id,
          // VCのID:バインドチャンネルのID:ループ:キューループ:関連曲
          value: this.data[id].exportStatus()
        });
      });
      Util.db.DatabaseAPI.SetIsSpeaking(speaking);
    }
    catch(e){
      this.Log(e, "warn");
    }
    t.end();
  }

  /**
   * 必要に応じてサーバーデータを初期化します
   */
  protected initData(guildid:string, channelid:string){
    const prev = this.data[guildid];
    if(!prev){
      const server = this.data[guildid] = new GuildDataContainer(this.client, guildid, channelid, this);
      server.player.setBinding(this.data[guildid]);
      server.queue.setBinding(this.data[guildid]);
      return server;
    }else{
      return prev;
    }
  }
}
