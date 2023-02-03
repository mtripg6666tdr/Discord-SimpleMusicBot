/*
 * Copyright 2021-2023 mtripg6666tdr
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

import type { AudioSource, YouTube } from "../AudioSource";
import type { GuildDataContainer } from "../Structure";
import type { MessageEmbedBuilder } from "@mtripg6666tdr/eris-command-resolver";
import type { Message, TextChannel, VoiceChannel } from "eris";
import type { Readable, Writable } from "stream";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import fs from "fs";
import path from "path";

import { resolveStreamToPlayable } from "./streams";
import { Normalizer } from "./streams/normalizer";
import { ServerManagerBase } from "../Structure";
import { Util } from "../Util";
import { getColor } from "../Util/color";
import { getFFmpegEffectArgs } from "../Util/effect";
import { FallBackNotice } from "../definition";

/**
 * サーバーごとの再生を管理するマネージャー。
 * 再生や一時停止などの処理を行います。
 */
export class PlayManager extends ServerManagerBase {
  protected readonly retryLimit = 3;
  protected _seek = 0;
  protected _errorReportChannel:TextChannel = null;
  protected _volume = 100;
  protected _errorCount = 0;
  protected _errorUrl = "";
  protected _preparing = false;
  protected _currentAudioInfo:AudioSource = null;
  protected _currentAudioStream:Readable = null;
  protected _cost = 0;
  csvLog:string[] = [];
  detailedLog = false;
  readonly onStreamFinishedBindThis:any = null;

  get preparing(){
    return this._preparing;
  }

  private set preparing(val:boolean){
    this._preparing = val;
  }

  get currentAudioInfo():Readonly<AudioSource>{
    return this._currentAudioInfo;
  }

  get currentAudioUrl():string{
    if(this.currentAudioInfo) return this.currentAudioInfo.Url;
    else return "";
  }

  get cost(){
    return this._cost;
  }

  /**
   *  接続され、再生途中にあるか（たとえ一時停止されていても）
   */
  get isPlaying():boolean{
    return this.isConnecting && this.server.connection.playing;
  }

  /**
   *  VCに接続中かどうか
   */
  get isConnecting():boolean{
    return this.server.connection && (this.server.connection.connecting || this.server.connection.ready);
  }

  /**
   * 一時停止されているか
   */
  get isPaused():boolean{
    return this.isConnecting && this.server.connection.paused;
  }

  /**
   *  現在ストリーミングした時間(ミリ秒!)
   * @remarks ミリ秒単位なので秒に直すには1000分の一する必要がある
   */
  get currentTime():number{
    return this.isPlaying ? this._seek * 1000 + this.server.connection.current?.playTime : 0;
  }

  get volume(){
    return this._volume;
  }

  // コンストラクタ
  constructor(){
    super();
    this.setTag("PlayManager");
    this.Log("Play Manager instantiated");
    this.onStreamFinishedBindThis = this.onStreamFinished.bind(this);
  }

  /**
   *  親となるGuildVoiceInfoをセットする関数（一回のみ呼び出せます）
   */
  override setBinding(data:GuildDataContainer){
    this.Log("Set data of guild id " + data.guildId);
    super.setBinding(data);
  }

  setVolume(val:number){
    this._volume = val;
    if((this.server.connection?.piper as any)?.["volume"]){
      this.server.connection.setVolume(val / 100);
      return true;
    }
    return false;
  }

  /**
   *  再生します
   */
  async play(time:number = 0):Promise<PlayManager>{
    this.emit("playCalled", time);
    // 再生できる状態か確認
    const badCondition = this.getIsBadCondition();
    if(badCondition){
      this.Log("Play called but operated nothing", "warn");
      return this;
    }
    this.Log("Play called");
    this.emit("playPreparing", time);
    this.preparing = true;
    let mes:Message = null;
    this._currentAudioInfo = this.server.queue.get(0).basicInfo;
    if(this.getNoticeNeeded()){
      const [min, sec] = Util.time.CalcMinSec(this.currentAudioInfo.LengthSeconds);
      const isLive = this.currentAudioInfo.isYouTube() && this.currentAudioInfo.LiveStream;
      mes = await this.server.bot.client.createMessage(
        this.server.boundTextChannel,
        `:hourglass_flowing_sand: \`${this.currentAudioInfo.Title}\` \`(${isLive ? "ライブストリーム" : `${min}:${sec}`})\`の再生準備中...`
      );
    }

    // ログ関係モジュール
    let connection = this.server.connection;
    this.csvLog = [];
    const filename = `stream-${Date.now()}.csv`;
    if(this.detailedLog){
      this.Log("CSV based detailed log enabled. Be careful of heavy memory usage.", "warn");
      this.Log(`CSV filename will be ${filename}`);
    }
    const getNow = () => {
      const now = new Date();
      return `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
    };
    const logStream = this.detailedLog && fs.createWriteStream(path.join(__dirname, `../../logs/${filename}`));
    const log = logStream ? (content:string) => {
      logStream.write(content + "\r\n");
      this.csvLog.push(content);
    } : () => {};
    log("type,datetime,id,total,current,buf");
    const setReadableCsvLog = (readable:Readable, i:number) => {
      if(!readable || !this.detailedLog) return;
      this.Log(`ID:${i}=${readable.constructor.name}`);
      let total = 0;
      readable
        .on("data", chunk => {
          // @ts-expect-error 7053
          log(`flow,${getNow()},${i},${total += chunk.length},${chunk.length},${typeof connection === "object" && connection.piper["_dataPackets"]?.reduce((a, b) => a.length + b.length, 0) || ""}`);
          log(`stock,${getNow()},${i},,${readable.readableLength},`);
        })
        .on("close", () => {
          log(`total,${getNow()},${i},${total}`);
          logStream.destroy();
        })
        .on("error", er => log(`error,${new Date().toLocaleString()},${i},${er}`))
      ;
    };
    // ここまで

    try{
      // シーク位置を確認
      if(this.currentAudioInfo.LengthSeconds <= time) time = 0;
      this._seek = time;
      const t = Util.time.timer.start("PlayManager#Play->FetchAudioSource");
      // QueueContentからストリーム情報を取得
      const rawStream = await this.currentAudioInfo.fetch(time > 0);
      // 情報からストリームを作成
      connection = this.server.connection;
      const channel = this.server.bot.client.getChannel(connection.channelID) as VoiceChannel;
      const { stream, streamType, cost, streams } = resolveStreamToPlayable(rawStream, getFFmpegEffectArgs(this.server), this._seek, this.volume !== 100, channel.bitrate);
      this._currentAudioStream = stream;
      if(this.detailedLog){
        streams.forEach(setReadableCsvLog);
        stream.pause();
      }
      // 各種準備
      this._errorReportChannel = mes?.channel as TextChannel;
      this._cost = cost;
      t.end();
      // 再生
      const u = Util.time.timer.start("PlayManager#Play->EnterPlayingState");
      const normalizer = new Normalizer(stream, this.volume !== 100);
      try{
        connection.play(normalizer, {
          format: streamType,
          inlineVolume: this.volume !== 100,
          voiceDataTimeout: 30 * 1000
        });
        if(this.detailedLog){
          // @ts-expect-error 7053
          const erisStreams = (connection.piper["streams"] as (Readable & Writable)[]);
          erisStreams.forEach((readable, i) => setReadableCsvLog(readable, i + streams.length));
          const volume = erisStreams.find(r => r.constructor.name === "VolumeTransformer");
          volume?.on("data", () => {
            if(volume.readableLength < 128 * 1024){
              normalizer.resume();
            }
          });
        }
        // setup volume
        this.setVolume(this.volume);
        // wait for entering playing state
        await Util.general.waitForEnteringState(() => this.server.connection.playing);
        this.preparing = false;
        this.emit("playStarted");
      }
      finally{
        u.end();
      }
      this.Log("Play started successfully");
      if(mes){
        // 再生開始メッセージ
        const _t = Number(this.currentAudioInfo.LengthSeconds);
        const [min, sec] = Util.time.CalcMinSec(_t);
        const timeFragments = Util.time.CalcHourMinSec(this.server.queue.lengthSecondsActual - (this.currentAudioInfo.LengthSeconds || 0));
        /* eslint-disable @typescript-eslint/indent */
        const embed = new Helper.MessageEmbedBuilder()
          .setTitle(":cd:現在再生中:musical_note:")
          .setDescription(
              `[${this.currentAudioInfo.Title}](${this.currentAudioUrl}) \``
            + (this.currentAudioInfo.ServiceIdentifer === "youtube" && (this.currentAudioInfo as YouTube).LiveStream ? "(ライブストリーム)" : _t === 0 ? "(不明)" : min + ":" + sec)
            + "`"
          )
          .setColor(getColor("AUTO_NP"))
          .addField("リクエスト", this.server.queue.get(0).additionalInfo.addedBy.displayName, true)
          .addField("次の曲",
            // トラックループオンなら現在の曲
            this.server.queue.loopEnabled ? this.server.queue.get(0).basicInfo.Title :
            // (トラックループはオフ)長さが2以上ならオフセット1の曲
            this.server.queue.length >= 2 ? this.server.queue.get(1).basicInfo.Title :
            // (トラックループオフ,長さ1)キューループがオンなら現在の曲
            this.server.queue.queueLoopEnabled ? this.server.queue.get(0).basicInfo.Title :
            // (トラックループオフ,長さ1,キューループオフ)次の曲はなし
            "次の曲がまだ登録されていません", true
          )
          .addField("再生待ちの曲", this.server.queue.loopEnabled ? "ループします" : (this.server.queue.length - 1) + "曲(" + Util.time.HourMinSecToString(timeFragments) + ")", true)
          .setThumbnail(this.currentAudioInfo.Thumnail)
        ;
        /* eslint-enable @typescript-eslint/indent */
        if(this.currentAudioInfo.ServiceIdentifer === "youtube" && (this.currentAudioInfo as YouTube).IsFallbacked){
          embed.addField(":warning:注意", FallBackNotice);
        }
        this.emit("playStartUIPrepared", embed);
        mes.edit({content: "", embeds: [embed.toEris()]}).catch(e => Util.logger.log(e, "error"));
      }
    }
    catch(e){
      Util.logger.log(e, "error");
      try{
        const t = typeof e === "string" ? e : Util.general.StringifyObject(e);
        if(t.includes("429")){
          mes?.edit(":sob:レート制限が検出されました。しばらくの間YouTubeはご利用いただけません。").catch(er => Util.logger.log(er, "error"));
          this.Log("Rate limit detected", "error");
          this.stop();
          this.preparing = false;
          return this;
        }
      } catch{ /* empty */ }
      if(mes){
        mes.edit(`:tired_face:曲の再生に失敗しました...。(${Util.general.FilterContent(Util.general.StringifyObject(e))})` + (this._errorCount + 1 >= this.retryLimit ? "スキップします。" : "再試行します。"));
        this.onStreamFailed();
      }
    }
    return this;
  }

  protected getIsBadCondition(){
    // 再生できる状態か確認
    return /* 接続していない */ !this.isConnecting
      // なにかしら再生中
      || this.isPlaying
      // キューが空
      || this.server.queue.isEmpty
      // 準備中
      || this.preparing
    ;
  }

  protected getNoticeNeeded(){
    return !!this.server.boundTextChannel;
  }

  /** 
   * 停止します。切断するにはDisconnectを使用してください。
   * @returns this
  */
  stop():PlayManager{
    this.Log("Stop called");
    if(this.server.connection){
      this.server.connection.off("end", this.onStreamFinishedBindThis);
      this.server.connection.stopPlaying();
      this.server.connection.on("end", this.onStreamFinishedBindThis);
      this.emit("stop");
    }
    return this;
  }

  /**
   * 切断します。内部的にはStopも呼ばれています。これを呼ぶ前にStopを呼ぶ必要はありません。
   * @returns this
   */
  disconnect():PlayManager{
    this.stop();
    if(this.isConnecting){
      const connection = this.server.connection;
      this.Log("Disconnected from " + connection.channelID);
      connection.disconnect();
      this.server.connection = null;
      this.emit("disconnect");
      this.destroyStream();
    }else{
      this.server.connection = null;
      this.Log("Disconnect called but no connection", "warn");
    }
    if(typeof global.gc === "function"){
      global.gc();
      this.Log("Called exposed gc");
    }
    return this;
  }

  destroyStream(){
    setImmediate(() => {
      if(this._currentAudioStream){
        if(!this._currentAudioStream.destroyed){
          this._currentAudioStream.destroy();
        }
        this._currentAudioStream = null;
      }
    });
  }

  /**
   * 一時停止します。
   * @returns this
   */
  pause():PlayManager{
    this.Log("Pause called");
    this.emit("pause");
    this.server.connection?.pause();
    return this;
  }

  /**
   * 一時停止再生します。
   * @returns this
   */
  resume():PlayManager{
    this.Log("Resume called");
    this.emit("resume");
    this.server.connection?.resume();
    return this;
  }

  /**
   * 頭出しをします。
   * @returns this
   */
  rewind():PlayManager{
    this.Log("Rewind called");
    this.emit("rewind");
    this.stop().play();
    return this;
  }

  handleError(er:any){
    Util.logger.log("Error", "error");
    this.emit("error", er);
    if(er){
      Util.logger.log(Util.general.StringifyObject(er), "error");
      if(Util.config.debug){
        console.error(er);
      }
    }
    this._errorReportChannel?.createMessage(":tired_face:曲の再生に失敗しました...。" + (this._errorCount + 1 >= this.retryLimit ? "スキップします。" : "再試行します。"));
    this.onStreamFailed();
  }

  resetError(){
    this._errorCount = 0;
    this._errorUrl = "";
  }

  async onStreamFinished(){
    this.Log("onStreamFinished called");
    if(this.server.connection && this.server.connection.playing){
      await Util.general.waitForEnteringState(() => !this.server.connection || !this.server.connection.playing, 20 * 1000)
        .catch(() => {
          this.Log("Stream has not ended in time and will force stream into destroying", "warn");
          this.stop();
        })
      ;
    }
    // ストリームが終了したら時間を確認しつつ次の曲へ移行
    this.Log("Stream finished");
    this.emit("playCompleted");
    // 再生が終わったら
    this._errorCount = 0;
    this._errorUrl = "";
    this._cost = 0;
    this.destroyStream();
    if(this.server.queue.loopEnabled){
      // 曲ループオンならばもう一度再生
      this.play();
      return;
    }else if(this.server.queue.onceLoopEnabled){
      // ワンスループが有効ならもう一度同じものを再生
      this.server.queue.onceLoopEnabled = false;
      this.play();
      return;
    }else{
      // キュー整理
      await this.server.queue.next();
    }
    // キューがなくなったら接続終了
    if(this.server.queue.isEmpty){
      this.Log("Queue empty");
      if(this.server.boundTextChannel){
        await this.server.bot.client
          .createMessage(this.server.boundTextChannel, ":upside_down: キューが空になりました")
          .catch(e => Util.logger.log(e, "error"))
        ;
      }
      const timer = setTimeout(() => {
        this.off("playCalled", playHandler);
        this.off("disconnect", playHandler);
        if(!this.isPlaying && this.server.boundTextChannel){
          this.server.bot.client
            .createMessage(this.server.boundTextChannel, ":wave:キューが空になったため終了します")
            .catch(e => Util.logger.log(e, "error"))
          ;
        }
        this.disconnect();
      }, 10 * 60 * 1000);
      const playHandler = () => clearTimeout(timer);
      this.once("playCalled", playHandler);
      this.once("disconnect", playHandler);
    // なくなってないなら再生開始！
    }else{
      this.play();
    }
  }

  async onStreamFailed(){
    this.Log("onStreamFailed called");
    this._cost = 0;
    this.destroyStream();
    if(this._errorUrl === this.currentAudioInfo?.Url){
      this._errorCount++;
    }else{
      this._errorCount = 1;
      this._errorUrl = this.currentAudioInfo.Url;
      if(this.currentAudioInfo.isYouTube()) this.currentAudioInfo.disableCache();
    }
    this.Log(`Play failed, (${this._errorCount}times)`, "warn");
    this.preparing = false;
    this.stop();
    if(this._errorCount >= this.retryLimit){
      if(this.server.queue.loopEnabled) this.server.queue.loopEnabled = false;
      if(this.server.queue.length === 1 && this.server.queue.queueLoopEnabled) this.server.queue.queueLoopEnabled = false;
      await this.server.queue.next();
    }
    this.play();
  }

  override emit<T extends keyof PlayManagerEvents>(eventName:T, ...args:PlayManagerEvents[T]){
    super.emit("all", ...args);
    return super.emit(eventName, ...args);
  }

  override on<T extends keyof PlayManagerEvents>(eventName:T, listener: (...args:PlayManagerEvents[T]) => void){
    return super.on(eventName, listener);
  }

  override once<T extends keyof PlayManagerEvents>(eventName:T, listener: (...args:PlayManagerEvents[T]) => void){
    return super.on(eventName, listener);
  }

  override off<T extends keyof PlayManagerEvents>(eventName:T, listener: (...args:PlayManagerEvents[T]) => void){
    return super.off(eventName, listener);
  }
}

interface PlayManagerEvents {
  volumeChanged: [volume:string];
  playCalled: [seek:number];
  playPreparing: [seek:number];
  playStarted: [];
  playStartUIPrepared: [message:MessageEmbedBuilder];
  playCompleted: [];
  stop: [];
  disconnect: [];
  pause: [];
  resume: [];
  rewind: [];
  error: [error:Error];
  all: [...any[]];
}
