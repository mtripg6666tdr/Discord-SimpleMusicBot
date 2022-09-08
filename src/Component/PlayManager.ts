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

import type { AudioSource, YouTube } from "../AudioSource";
import type { GuildDataContainer } from "../Structure";
import type { Message, TextChannel, VoiceChannel } from "eris";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { ManagerBase } from "../Structure";
import { Util } from "../Util";
import { getColor } from "../Util/color";
import { getFFmpegEffectArgs } from "../Util/effect";
import { FallBackNotice } from "../definition";
import { resolveStreamToPlayable } from "./streams";

/**
 * サーバーごとの再生を管理するマネージャー。
 * 再生や一時停止などの処理を行います。
 */
export class PlayManager extends ManagerBase {
  private readonly retryLimit = 3;
  private _seek = 0;
  private _errorReportChannel = null as TextChannel;
  private _volume = 100;
  private _errorCount = 0;
  private _errorUrl = "";
  private _preparing = false;
  private _currentAudioInfo = null as AudioSource;
  private _cost = 0;

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
  }

  /**
   *  親となるGuildVoiceInfoをセットする関数（一回のみ呼び出せます）
   */
  setBinding(data:GuildDataContainer){
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
    /* eslint-disable operator-linebreak */
    /* eslint-disable @typescript-eslint/indent */
    // 再生できる状態か確認
    const badCondition =
      // 接続していない
        !this.isConnecting
      // なにかしら再生中
      || this.isPlaying
      // キューが空
      || this.server.queue.isEmpty
      // 準備中
      || this.preparing
    ;
    /* eslint-enable operator-linebreak */
    /* eslint-enable @typescript-eslint/indent */
    if(badCondition){
      this.Log("Play called but operated nothing", "warn");
      return this;
    }
    this.Log("Play called");
    this.preparing = true;
    let mes:Message = null;
    let ch:TextChannel = null;
    this._currentAudioInfo = this.server.queue.get(0).basicInfo;
    if(this.server.boundTextChannel){
      ch = this.server.bot.client.getChannel(this.server.boundTextChannel) as TextChannel;
      const [min, sec] = Util.time.CalcMinSec(this.currentAudioInfo.LengthSeconds);
      const isLive = this.currentAudioInfo.isYouTube() && this.currentAudioInfo.LiveStream;
      mes = await ch.createMessage(`:hourglass_flowing_sand: \`${this.currentAudioInfo.Title}\` \`(${isLive ? "ライブストリーム" : `${min}:${sec}`})\`の再生準備中...`);
    }
    try{
      // シーク位置を確認
      if(this.currentAudioInfo.LengthSeconds <= time) time = 0;
      this._seek = time;
      const t = Util.time.timer.start("PlayManager#Play->FetchAudioSource");
      // QueueContentからストリーム情報を取得
      const rawStream = await this.currentAudioInfo.fetch(time > 0);
      // 情報からストリームを作成
      const connection = this.server.connection;
      const channel = this.server.bot.client.getChannel(connection.channelID) as VoiceChannel;
      const { stream, streamType, cost } = resolveStreamToPlayable(rawStream, getFFmpegEffectArgs(this.server), this._seek, this.volume !== 100, channel.bitrate);
      // ストリームがまだ利用できない場合待機
      let errorWhileWaiting = null as Error;
      stream.once("error", e => errorWhileWaiting = e || new Error("An error occurred in stream"));
      const getStreamReadable = () => !(stream.readableEnded || stream.destroyed || errorWhileWaiting) && stream.readableLength > 0;
      if(!getStreamReadable()){
        this.Log("Stream has not been readable yet. Waiting...", "debug");
        await Util.general.waitForEnteringState(getStreamReadable, 20 * 1000);
      }
      if(errorWhileWaiting){
        throw errorWhileWaiting;
      }
      // 各種準備
      this._errorReportChannel = mes.channel as TextChannel;
      this._cost = cost;
      t.end();
      // 再生
      const u = Util.time.timer.start("PlayManager#Play->EnterPlayingState");
      connection.play(stream, {
        format: streamType,
        inlineVolume: this.volume !== 100,
        voiceDataTimeout: 10 * 1000
      });
      // setup volume
      this.setVolume(this.volume);
      ((connection.piper as any)["_endStream"]).once("end", this.onStreamFinished.bind(this));
      // wait for entering playing state
      await Util.general.waitForEnteringState(() => this.server.connection.playing);
      this.preparing = false;
      u.end();
      this.Log("Play started successfully");
      if(this.server.boundTextChannel && ch && mes){
        // 再生開始メッセージ
        const _t = Number(this.currentAudioInfo.LengthSeconds);
        const [min, sec] = Util.time.CalcMinSec(_t);
        const [qhour, qmin, qsec] = Util.time.CalcHourMinSec(this.server.queue.lengthSeconds - this.currentAudioInfo.LengthSeconds);
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
          .addField("再生待ちの曲", this.server.queue.loopEnabled ? "ループします" : (this.server.queue.length - 1) + "曲(" + (qhour === "0" ? "" : qhour + ":") + qmin + ":" + qsec + ")", true)
          .setThumbnail(this.currentAudioInfo.Thumnail)
        ;
        /* eslint-enable @typescript-eslint/indent */
        if(this.currentAudioInfo.ServiceIdentifer === "youtube" && (this.currentAudioInfo as YouTube).IsFallbacked){
          embed.addField(":warning:注意", FallBackNotice);
        }
        mes.edit({content: "", embeds: [embed.toEris()]}).catch(e => Util.logger.log(e, "error"));
      }
    }
    catch(e){
      Util.logger.log(Util.general.StringifyObject(e), "error");
      try{
        const t = typeof e === "string" ? e : Util.general.StringifyObject(e);
        if(t.includes("429")){
          mes.edit(":sob:レート制限が検出されました。しばらくの間YouTubeはご利用いただけません。").catch(er => Util.logger.log(er, "error"));
          this.Log("Rate limit detected", "error");
          this.stop();
          this.preparing = false;
          return this;
        }
        // eslint-disable-next-line no-empty
      } catch{}
      if(this.server.boundTextChannel && ch && mes){
        mes.edit(`:tired_face:曲の再生に失敗しました...。(${Util.general.StringifyObject(e)})` + (this._errorCount + 1 >= this.retryLimit ? "スキップします。" : "再試行します。"));
        this.onStreamFailed();
      }
    }
    return this;
  }

  /** 
   * 停止します。切断するにはDisconnectを使用してください。
   * @returns this
  */
  stop():PlayManager{
    this.Log("Stop called");
    this.server.connection?.stopPlaying();
    this.server.bot.backupper.backupData();
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

  /**
   * 一時停止します。
   * @returns this
   */
  pause():PlayManager{
    this.server.bot.backupper.backupStatus();
    this.Log("Pause called");
    this.server.connection?.pause();
    return this;
  }

  /**
   * 一時停止再生します。
   * @returns this
   */
  resume():PlayManager{
    this.server.bot.backupper.backupStatus();
    this.Log("Resume called");
    this.server.connection?.resume();
    return this;
  }

  /**
   * 頭出しをします。
   * @returns this
   */
  rewind():PlayManager{
    this.Log("Rewind called");
    this.stop().play();
    return this;
  }

  handleError(er:any){
    Util.logger.log("Error", "error");
    if(er){
      Util.logger.log(Util.general.StringifyObject(er), "error");
      if(Util.config.debug){
        console.error(er);
      }
    }
    this._errorReportChannel.createMessage(":tired_face:曲の再生に失敗しました...。" + (this._errorCount + 1 >= this.retryLimit ? "スキップします。" : "再試行します。"));
    this.onStreamFailed();
  }

  resetError(){
    this._errorCount = 0;
    this._errorUrl = "";
  }

  private async onStreamFinished(){
    this.Log("onStreamFinished called");
    if(this.server.connection){
      await Util.general.waitForEnteringState(() => !this.server.connection || !this.server.connection.playing, 20 * 1000)
        .catch(() => {
          this.Log("Stream has not ended in time and will force stream into destroying", "warn");
          this.stop();
        })
      ;
    }
    // ストリームが終了したら時間を確認しつつ次の曲へ移行
    this.Log("Stream finished");
    // 再生が終わったら
    this._errorCount = 0;
    this._errorUrl = "";
    this._cost = 0;
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
    if(this.server.queue.length === 0){
      this.Log("Queue empty");
      if(this.server.boundTextChannel){
        const ch = this.server.bot.client.getChannel(this.server.boundTextChannel) as TextChannel;
        await ch.createMessage(":wave:キューが空になったため終了します").catch(e => Util.logger.log(e, "error"));
      }
      this.disconnect();
    // なくなってないなら再生開始！
    }else{
      this.play();
    }
  }

  private async onStreamFailed(){
    this.Log("onStreamFailed called");
    this._cost = 0;
    if(this._errorUrl === this.currentAudioInfo.Url){
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
}
