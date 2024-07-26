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

import type { AudioSource } from "../AudioSource";
import type { GuildDataContainer } from "../Structure";
import type { AudioPlayer } from "@discordjs/voice";
import type { AnyTextableGuildChannel, TextChannel, Member, Message } from "oceanic.js";
import type { Readable } from "stream";

import { NoSubscriberBehavior } from "@discordjs/voice";
import { AudioPlayerStatus, createAudioResource, createAudioPlayer, entersState, StreamType, VoiceConnectionStatus } from "@discordjs/voice";
import { MessageActionRowBuilder, MessageButtonBuilder, MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";
import i18next from "i18next";
import { MessageFlags } from "oceanic.js";

import { FixedAudioResource } from "./audioResource";
import { DeferredMessage } from "./deferredMessage";
import { resolveStreamToPlayable } from "./streams";
import { DSL } from "./streams/dsl";
import { Normalizer } from "./streams/normalizer";
import { ServerManagerBase } from "../Structure";
import * as Util from "../Util";
import { getColor } from "../Util/color";
import { measureTime } from "../Util/decorators";
import { getConfig } from "../config";
import { NowPlayingNotificationLevel } from "../types/GuildPreferences";


interface PlayManagerEvents {
  volumeChanged: [volume:string];
  playCalled: [seek:number];
  playPreparing: [seek:number];
  playStarted: [];
  playStartUIPrepared: [message:MessageEmbedBuilder];
  playCompleted: [];
  playFailed: [];
  reportPlaybackDuration: [duration: number, errorCount: number];
  stop: [];
  disconnect: [];
  disconnectAttempt: [];
  pause: [];
  resume: [];
  rewind: [];
  empty: [];
  handledError: [error:Error];
  all: [...any[]];
}

/** PlayManager#playに渡せるオプションを指定します */
// eslint-disable-next-line @typescript-eslint/ban-types
export type PlayManagerPlayOptions = Record<string & {}, string | boolean | number> & {
  /** シークする際に、シーク先の秒数を指定します */
  time?: number,
  /** エテキストチャンネルにメッセージを送信するかどうかを指定します */
  quiet?: boolean,
};

const config = getConfig();

/**
 * サーバーごとの再生を管理するマネージャー。
 * 再生や一時停止などの処理を行います。
 */
export class PlayManager extends ServerManagerBase<PlayManagerEvents> {
  protected readonly retryLimit = 3;
  protected _seek = 0;
  protected _errorReportChannel: TextChannel | null = null;
  protected _volume = 100;
  protected _errorCount = 0;
  protected _errorUrl = "";
  protected _preparing = false;
  protected _currentAudioInfo: AudioSource<any, any> | null = null;
  protected _currentAudioStream: Readable | null = null;
  protected _cost = 0;
  protected _finishTimeout = false;
  protected _player: AudioPlayer | null = null;
  protected _resource: FixedAudioResource | null = null;
  protected _waitForLiveAbortController: AbortController | null = null;
  protected _dsLogger: DSL | null = null;
  protected _playing: boolean = false;
  protected _lastMember: string | null = null;
  protected _sleeptimerCurrentSong: boolean = false;
  protected _sleeptimerTimeout: NodeJS.Timeout | null = null;

  get preparing(){
    return this._preparing;
  }

  private set preparing(val: boolean){
    this._preparing = val;
  }

  get currentAudioInfo(): Readonly<AudioSource<any, any>> | null {
    return this._currentAudioInfo;
  }

  get currentAudioUrl(): string {
    if(this.currentAudioInfo) return this.currentAudioInfo.url;
    else return "";
  }

  get cost(){
    return this._cost;
  }

  /**
   *  接続され、再生途中にあるか（たとえ一時停止されていても）
   */
  get isPlaying(): boolean {
    return this.isConnecting
      && !!this._player
      && (this._player.state.status === AudioPlayerStatus.Playing || this._player.state.status === AudioPlayerStatus.Paused || !!this._waitForLiveAbortController);
  }

  /**
   *  VCに接続中かどうか
   */
  get isConnecting(): boolean{
    return !!this.server.connection && this.server.connection.state.status === VoiceConnectionStatus.Ready;
  }

  /**
   * 一時停止されているか
   */
  get isPaused(): boolean{
    return this.isConnecting && !!this._player && this._player.state.status === AudioPlayerStatus.Paused;
  }

  /**
   *  現在ストリーミングした時間(ミリ秒!)
   * @remarks ミリ秒単位なので秒に直すには1000分の一する必要がある
   */
  get currentTime(): number{
    if(!this.isPlaying || this._player!.state.status === AudioPlayerStatus.Idle || this._player!.state.status === AudioPlayerStatus.Buffering){
      return 0;
    }
    return this._seek * 1000 + this._player!.state.playbackDuration;
  }

  get volume(){
    return this._volume;
  }

  /** 再生終了時に、アイドル状態のままボイスチャンネルに接続したままになってるかどうかを取得します */
  get finishTimeout(){
    return this._finishTimeout;
  }

  get isWaiting(){
    return !!this._waitForLiveAbortController;
  }

  // コンストラクタ
  constructor(parent: GuildDataContainer){
    super("PlayManager", parent);
    this.logger.info("PlayManager instantiated.");
  }

  setVolume(val: number){
    this._volume = val;
    if(this._resource?.volumeTransformer){
      this._resource.volumeTransformer.setVolumeLogarithmic(val / 100);
      return true;
    }
    return false;
  }

  /**
   *  再生します
   */
  @measureTime
  async play(options: PlayManagerPlayOptions = {}): Promise<PlayManager>{
    let time = options.time || 0;
    const quiet = options.quiet || false;

    this.emit("playCalled", time);

    // 再生できる状態か確認
    if(this.getIsBadCondition()){
      this.logger.warn("#play called but operated nothing");
      return this;
    }

    this.logger.info("#play called");
    this.emit("playPreparing", time);
    this.preparing = true;

    let messageSendingScheduledAt: number | null = null;
    let message: DeferredMessage | Message | null = null;

    this._currentAudioInfo = this.server.queue.get(0).basicInfo;

    const [min, sec] = Util.time.calcMinSec(this.currentAudioInfo!.lengthSeconds);
    const isYT = this.currentAudioInfo!.isYouTube();
    const isLive = isYT && this.currentAudioInfo.isLiveStream;

    if(isYT && this.currentAudioInfo.availableAfter){
      const waitTarget = this.currentAudioInfo;
      // まだ始まっていないライブを待機する
      message = this.getNoticeNeeded() && !quiet && await this.server.bot.client.rest.channels.createMessage(
        this.server.boundTextChannel,
        {
          content: `:stopwatch:${i18next.t("components:play.waitingForLiveStream", {
            lng: this.server.locale,
            title: this.currentAudioInfo.title,
          })}`,
        }
      ) || null;
      this.preparing = false;
      const abortController = this._waitForLiveAbortController = new AbortController();
      this.once("stop", () => {
        abortController.abort();
      });
      await waitTarget.waitForLive(abortController.signal, () => {
        if(waitTarget !== this._currentAudioInfo){
          abortController.abort();
        }
      });
      if(abortController.signal.aborted){
        this._waitForLiveAbortController = null;
        const content = `:white_check_mark: ${i18next.t("components:play.waitingForLiveCanceled", { lng: this.server.locale })}`;

        if(message){
          message.edit({ content }).catch(this.logger.error);
        }else{
          this.server.bot.client.rest.channels.createMessage(
            this.server.boundTextChannel,
            { content }
          ).catch(this.logger.error);
        }

        return this;
      }
      this._waitForLiveAbortController = null;
      this.preparing = true;
    }else if(this.getNoticeNeeded() && !quiet && this.server.preferences.nowPlayingNotificationLevel !== NowPlayingNotificationLevel.Disable){
      // 通知メッセージを送信する（可能なら）
      message = DeferredMessage.create(
        this.server.bot.client.getChannel<AnyTextableGuildChannel>(this.server.boundTextChannel)
        || await this.server.bot.client.rest.channels.get<AnyTextableGuildChannel>(this.server.boundTextChannel),
        2.5e3,
        {
          content: `:hourglass_flowing_sand:${
            i18next.t("components:play.preparing", {
              title: `\`${this.currentAudioInfo!.title}\` \`(${
                isLive ? i18next.t("liveStream", { lng: this.server.locale }) : `${min}:${sec}`
              })\``,
              lng: this.server.locale,
            })
          }...`,
          flags: this.server.preferences.nowPlayingNotificationLevel === NowPlayingNotificationLevel.Silent
            ? MessageFlags.SUPPRESS_NOTIFICATIONS
            : 0,
        }
      )
        .on("error", this.logger.error)
        .on("debug", this.logger.debug);
      messageSendingScheduledAt = Date.now();
    }

    // try...catchブロックに入る前に、エラーレポートチャンネルを決定しておく
    this._errorReportChannel = (message?.channel as TextChannel | undefined)
        || this.server.bot.client.getChannel<TextChannel>(this.server.boundTextChannel)
        || await this.server.bot.client.rest.channels.get<TextChannel>(this.server.boundTextChannel);

    try{
      // シーク位置を確認
      if(this.currentAudioInfo!.lengthSeconds <= time) time = 0;
      this._seek = time;

      // QueueContentからストリーム情報を取得
      const rawStream = await this.currentAudioInfo!.fetch(time > 0);

      // 情報からストリームを作成
      // 万が一ストリームのfetch中に切断された場合には、リソース開放してplayを抜ける
      const voiceChannel = this.server.connectingVoiceChannel;
      if(!voiceChannel){
        if(rawStream.type === "readable"){
          rawStream.stream.once("error", () => {});
          rawStream.stream.destroy();
        }
        return this;
      }
      const { stream, streamType, cost, streams } = await resolveStreamToPlayable(rawStream, {
        effects: this.server.audioEffects.export(),
        seek: this._seek,
        volumeTransformEnabled: this.volume !== 100,
        bitrate: voiceChannel.bitrate,
      });
      this._currentAudioStream = stream;

      // ログ
      if(process.env.DSL_ENABLE){
        this._dsLogger = new DSL({ enableFileLog: true });
        this._dsLogger.appendReadable(...streams);
      }

      // 各種準備
      this._cost = cost;
      this._lastMember = null;
      this.prepareAudioPlayer();

      const normalizer = new Normalizer(stream, this.volume !== 100);
      normalizer.once("end", this.onStreamFinished.bind(this));
      const resource = this._resource = FixedAudioResource.fromAudioResource(
        createAudioResource(normalizer, {
          inputType:
            streamType === "webm/opus"
              ? StreamType.WebmOpus
              : streamType === "ogg/opus"
                ? StreamType.OggOpus
                : streamType === "raw"
                  ? StreamType.Raw
                  : streamType === "opus"
                    ? StreamType.Opus
                    : StreamType.Arbitrary,
          inlineVolume: this.volume !== 100,
        }),
        this.currentAudioInfo!.lengthSeconds - time
      );
      this._dsLogger?.appendReadable(normalizer);

      // start to play!
      this._player!.play(resource);

      // setup volume
      this.setVolume(this.volume);

      // wait for player entering the playing state
      const waitingSucceeded = await entersState(this._player!, AudioPlayerStatus.Playing, 30e3)
        .then(() => true)
        .catch(() => false);

      if(this._player?.state.status === AudioPlayerStatus.Buffering){
        throw new Error("Resource timeout exceeded.");
      }

      // when occurring one or more error(s) while waiting for player,
      // the error(s) should be also emitted from AudioPlayer and handled by PlayManager#handleError
      // so simply ignore the error(s) here.
      if(!waitingSucceeded){
        if(message instanceof DeferredMessage){
          message.cancelSchedule();
        }

        return this;
      }

      this.preparing = false;
      this._playing = true;
      this.emit("playStarted");

      this.logger.info("Playback started successfully");

      // 現在再生中パネルを送信していい環境な場合に以下のブロックを実行する
      if(message){
        // 再生開始メッセージ
        const messageContent = this.createNowPlayingMessage();

        this.logger.debug(`Preparing elapsed time: ${Date.now() - messageSendingScheduledAt!}ms`);

        const replyMessage = await message.edit({
          ...messageContent,
          flags: this.server.preferences.nowPlayingNotificationLevel === NowPlayingNotificationLevel.Silent
            ? MessageFlags.SUPPRESS_NOTIFICATIONS
            : 0,
        }).catch(er => {
          this.logger.error(er);
          return null;
        });

        // エラー等でmessageがnullになっている場合は何もしない
        if(replyMessage){
          this.eitherOnce(["playCompleted", "handledError", "stop"], () => {
            replyMessage.edit({
              components: [],
            }).catch(this.logger.error);
          });
        }
      }

      // ラジオが有効になっている場合、次の曲を準備する
      if(
        this.server.queue.mixPlaylistEnabled
        && this.server.queue.get(0).additionalInfo.addedBy.userId === "2"
        && this.server.queue.filter(item => item.additionalInfo.addedBy.userId === "2").length <= 2
      ){
        await this.server.queue.prepareNextMixItem();
      }

      // 条件に合致した場合、次の曲をプリフェッチする
      if(this.server.queue.length >= 2 && this.currentAudioInfo!.lengthSeconds <= 7200 /* 2 * 60 * 60 */){
        const nextSong = this.server.queue.get(1);
        if(nextSong.basicInfo.isYouTube()){
          this.logger.info("Prefetching next song beforehand.");
          await nextSong.basicInfo.refreshInfo({ forceCache: true, onlyIfNoCache: true }).catch(this.logger.error);
        }
      }
    }
    catch(e){
      if(message instanceof DeferredMessage){
        message.cancelSchedule();
      }

      this.handleError(e).catch(this.logger.error);
    }
    finally{
      this.preparing = false;
    }
    return this;
  }

  private createNowPlayingMessage(){
    if(!this.currentAudioInfo){
      throw new Error("Current audio info was null.");
    }

    const _t = Number(this.currentAudioInfo.lengthSeconds);
    const [min, sec] = Util.time.calcMinSec(_t);
    const queueTimeFragments = Util.time.calcHourMinSec(
      this.server.queue.lengthSecondsActual - (this.currentAudioInfo.lengthSeconds >= 0 ? this.currentAudioInfo.lengthSeconds : 0)
    );
    /* eslint-disable @typescript-eslint/indent */
    const embed = new MessageEmbedBuilder()
      .setTitle(
        `:cd: ${
          i18next.t("components:nowplaying.nowplayingTitle", { lng: this.server.locale })
        }${
          this.currentAudioInfo.isYouTube() ? this.currentAudioInfo.getStrategyIndicator() : ""
        } :musical_note:`
      )
      .setDescription(
        (
          this.currentAudioInfo.isPrivateSource
            ? `${this.currentAudioInfo.title} \``
            : `[${this.currentAudioInfo.title}](${this.currentAudioUrl}) \``
        )
        + (
          this.currentAudioInfo.isYouTube() && this.currentAudioInfo.isLiveStream
            ? `(${i18next.t("liveStream", { lng: this.server.locale })})`
            : _t === 0 ? `(${i18next.t("unknown", { lng: this.server.locale })})` : min + ":" + sec
        )
        + "`"
      )
      .setColor(getColor("AUTO_NP"))
      .addField(
        i18next.t("components:nowplaying.requestedBy", { lng: this.server.locale }),
        this.server.queue.get(0).additionalInfo.addedBy.displayName,
        true
      )
      .addField(
        i18next.t("components:nowplaying.nextSong", { lng: this.server.locale }),
        // トラックループオンなら現在の曲
        this.server.queue.loopEnabled ? this.server.queue.get(0).basicInfo.title
        // (トラックループはオフ)長さが2以上ならオフセット1の曲
        : this.server.queue.length >= 2 ? this.server.queue.get(1).basicInfo.title
        // (トラックループオフ,長さ1)キューループがオンなら現在の曲
        : this.server.queue.queueLoopEnabled ? this.server.queue.get(0).basicInfo.title
        // (トラックループオフ,長さ1,キューループオフ)次の曲はなし
        : i18next.t("components:nowplaying.noNextSong", { lng: this.server.locale }), true
      )
      .addField(
        i18next.t("components:play.songsInQueue", { lng: this.server.locale }),
        this.server.queue.loopEnabled
          ? i18next.t("components:play.willLoop", { lng: this.server.locale })
          : `${i18next.t(
              "currentSongCount",
              {
                count: this.server.queue.length - 1,
                lng: this.server.locale,
              }
            )}(${Util.time.HourMinSecToString(queueTimeFragments, i18next.getFixedT(this.server.locale))})`
            + (this.server.queue.mixPlaylistEnabled ? `(${i18next.t("components:nowplaying.inRadio")})` : "")
          ,
        true
      );

    if(typeof this.currentAudioInfo.thumbnail === "string"){
      embed.setThumbnail(this.currentAudioInfo.thumbnail);
    }else{
      embed.setThumbnail("attachment://thumbnail." + this.currentAudioInfo.thumbnail.ext);
    }

    /* eslint-enable @typescript-eslint/indent */

    if(this.currentAudioInfo.isYouTube()){
      if(this.currentAudioInfo.isFallbacked){
        embed.addField(
          `:warning: ${i18next.t("attention", { lng: this.server.locale })}`,
          i18next.t("components:queue.fallbackNotice", { lng: this.server.locale })
        );
      }
    }

    this.emit("playStartUIPrepared", embed);

    const components = [
      new MessageActionRowBuilder()
        .addComponents(
          new MessageButtonBuilder()
            .setCustomId("control_rewind")
            .setEmoji("⏮️")
            .setLabel(i18next.t("components:controlPanel.rewind", { lng: this.server.locale }))
            .setStyle("SECONDARY"),
          new MessageButtonBuilder()
            .setCustomId("control_playpause")
            .setEmoji("⏯️")
            .setLabel(`${
              i18next.t("components:controlPanel.play", { lng: this.server.locale })
            }/${
              i18next.t("components:controlPanel.pause", { lng: this.server.locale })
            }`)
            .setStyle("PRIMARY"),
          new MessageButtonBuilder()
            .setCustomId("control_skip")
            .setEmoji("⏭️")
            .setLabel(i18next.t("components:controlPanel.skip", { lng: this.server.locale }))
            .setStyle("SECONDARY"),
          new MessageButtonBuilder()
            .setCustomId("control_onceloop")
            .setEmoji("🔂")
            .setLabel(i18next.t("components:controlPanel.onceloop", { lng: this.server.locale }))
            .setStyle("SECONDARY"),
        )
        .toOceanic(),
    ];

    if(typeof this.currentAudioInfo.thumbnail === "string"){
      return {
        content: "",
        embeds: [embed.toOceanic()],
        components,
      };
    }else{
      return {
        content: "",
        embeds: [embed.toOceanic()],
        components,
        files: [
          {
            name: "thumbnail." + this.currentAudioInfo.thumbnail.ext,
            contents: this.currentAudioInfo.thumbnail.data,
          },
        ],
      };
    }
  }

  protected prepareAudioPlayer(){
    if(this._player || !this.server.connection) return;
    this._player = createAudioPlayer({
      debug: config.debug,
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });
    if(config.debug){
      this._player.on("debug", message => this.logger.trace(`[InternalAudioPlayer] ${message}`));
    }
    this._player.on("error", this.handleError.bind(this));
    this._player.on(AudioPlayerStatus.Idle, (oldState) => {
      if(oldState.status === AudioPlayerStatus.Playing){
        this.emit(
          "reportPlaybackDuration",
          oldState.playbackDuration,
          this._errorUrl === this.currentAudioUrl ? this._errorCount : 0
        );
      }
    });
    this.server.connection.subscribe(this._player);
  }

  protected getIsBadCondition(){
    if(config.debug){
      this.logger.debug(`Condition: { connecting: ${this.isConnecting}, playing: ${this.isPlaying}, empty: ${this.server.queue.isEmpty}, preparing: ${this.preparing} }`);
    }
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
  async stop({ force = false, wait = false }: { force?: boolean, wait?: boolean } = {}): Promise<PlayManager> {
    this.logger.info("Stop called");
    this._playing = false;
    if(this.server.connection){
      this._cost = 0;
      if(this._player){
        this._player.unpause();
        this._player.stop(force);
        if(wait){
          await entersState(this._player, AudioPlayerStatus.Idle, 10e3).catch(() => {
            this.logger.warn("Player didn't stop in time; force-stopping");
            this._player?.stop(true);
          });
        }
      }
      this.emit("stop");
    }
    return this;
  }

  /**
   * 切断します。内部的にはStopも呼ばれています。これを呼ぶ前にStopを呼ぶ必要はありません。
   * @returns this
   */
  async disconnect(): Promise<PlayManager> {
    await this.stop({ force: true });
    this.emit("disconnectAttempt");

    if(this.server.connection){
      this.logger.info("Disconnected from " + this.server.connectingVoiceChannel!.id);
      this.server.connection.disconnect();
      this.server.connection.destroy();
      this.emit("disconnect");
    }else{
      this.logger.warn("Disconnect called but no connection");
    }

    // attempt to destroy current stream
    this.destroyStream();

    this.server.connection = null;
    this.server.connectingVoiceChannel = null;
    this._player = null;
    this._sleeptimerCurrentSong = false;
    this.clearSleepTimerTimeout();

    if(typeof global.gc === "function"){
      global.gc();
      this.logger.info("Called exposed gc");
    }
    return this;
  }

  destroyStream(){
    if(this._currentAudioStream){
      if(!this._currentAudioStream.destroyed){
        this._currentAudioStream.destroy();
      }
      this._currentAudioStream = null;
      if(this._resource){
        this._resource = null;
      }
      this._dsLogger?.destroy();
    }
  }

  /**
   * 一時停止します。
   * @returns this
   */
  pause(lastMember?: Member): PlayManager{
    this.logger.info("Pause called");
    this.emit("pause");
    this._player!.pause();
    this._lastMember = lastMember?.id || null;
    return this;
  }

  /**
   * 一時停止再生します。
   * @returns this
   */
  resume(member?: Member): PlayManager{
    this.logger.info("Resume called");
    this.emit("resume");
    if(!member || member.id === this._lastMember){
      this._player!.unpause();
      this._lastMember = null;
    }
    return this;
  }

  /**
   * 頭出しをします。
   * @returns this
   */
  async rewind(): Promise<PlayManager> {
    this.logger.info("Rewind called");
    this.emit("rewind");
    await this.stop({ wait: true });
    await this.play().catch(this.logger.error);
    return this;
  }

  async handleError(er: any){
    this.logger.error(er);
    this.emit("handledError", er);

    if(er instanceof Error){
      if("type" in er && er.type === "workaround"){
        this
          .onStreamFailed(/* quiet */ true)
          .catch(this.logger.error);
        return;
      }
    }

    await this._errorReportChannel?.createMessage({
      content: `:tired_face:${i18next.t("components:play.failedToPlay", { lng: this.server.locale })}`
        + (
          this._errorCount + 1 >= this.retryLimit
            ? i18next.t("components:play.failedAndSkipping", { lng: this.server.locale })
            : i18next.t("components:play.failedAndRetrying", { lng: this.server.locale })
        ),
    });
    await this.onStreamFailed();
  }

  resetError(){
    this._errorCount = 0;
    this._errorUrl = "";
  }

  protected async onStreamFinished(){
    // 再生状態でないときに発生したエラーは基本的に無視する
    if(!this.currentAudioUrl || !this._playing){
      // ただし、ストリームの準備中に発生したエラーはエラーハンドリングして再試行に回す
      if(this.preparing){
        await this.handleError(new Error("Something went wrong while playing stream"));
      }
      return;
    }

    this._playing = false;
    this.logger.info("onStreamFinished called");

    // まだ状態が再生中のままであるときには、再生停止中になるまで、最大20秒間待機する
    if(this.server.connection && this._player?.state.status === AudioPlayerStatus.Playing){
      await entersState(this._player, AudioPlayerStatus.Idle, 20e3)
        .catch(() => {
          this.logger.warn("Stream has not ended in time and will force stream into destroying");
          return this.stop({ force: true });
        })
      ;
    }

    // ストリームが終了したら時間を確認しつつ次の曲へ移行
    this.logger.info("Stream finished");
    this.emit("playCompleted");

    // 各種リセット、ストリームの破棄
    this._errorCount = 0;
    this._errorUrl = "";
    this._cost = 0;
    this.destroyStream();

    // スリープタイマーの処理
    if(this._sleeptimerCurrentSong){
      if(!this.server.queue.loopEnabled && !this.server.queue.queueLoopEnabled){
        await this.server.queue.next();
      }

      await this.sendSleepMessage();
      await this.disconnect().catch(this.logger.error);

      return;
    }

    if(this.server.queue.loopEnabled){
      // 曲ループオンならばもう一度再生
      await this.play();
    }else if(this.server.queue.onceLoopEnabled){
      // ワンスループが有効ならもう一度同じものを再生
      this.server.queue.onceLoopEnabled = false;
      await this.play();
    }else{
      // キュー整理
      await this.server.queue.next();

      // キューがなくなったら接続終了
      if(this.server.queue.isEmpty){
        await this.onQueueEmpty();
      }else{
        // なくなってないなら再生開始！
        await this.play();
      }
    }
  }

  async onQueueEmpty(){
    this.logger.info("Queue empty");
    this.destroyStream();

    // 紐づけチャンネルが存在する場合、キューが空になった旨をレポートする
    if(this.server.boundTextChannel){
      await this.server.bot.client.rest.channels
        .createMessage(this.server.boundTextChannel, {
          content: `:upside_down:${i18next.t("components:play.queueEmpty", { lng: this.server.locale })}`,
        })
        .catch(this.logger.error)
      ;
    }

    const timer = setTimeout(() => {
      // unset event handler
      this.off("playCalled", clearFinishTimeout);
      this.off("disconnectAttempt", clearFinishTimeout);

      this._finishTimeout = false;

      if(this.server.boundTextChannel){
        this.server.bot.client.rest.channels
          .createMessage(this.server.boundTextChannel, {
            content: `:wave:${i18next.t("components:play.queueEmptyAndExiting", { lng: this.server.locale })}`,
          })
          .catch(this.logger.error);
      }

      this.disconnect().catch(this.logger.error);
    }, 10 * 60 * 1000).unref();

    this._finishTimeout = true;

    const clearFinishTimeout = () => {
      clearTimeout(timer);
      this._finishTimeout = false;
    };

    // set event handler
    this.once("playCalled", clearFinishTimeout);
    this.once("disconnectAttempt", clearFinishTimeout);
  }

  protected async onStreamFailed(quiet: boolean = false){
    this._playing = false;
    this.logger.info("onStreamFailed called");
    this.emit("playFailed");
    this._cost = 0;
    this.destroyStream();
    this.currentAudioInfo!.purgeCache();

    if(this._errorUrl === this.currentAudioInfo!.url && !quiet){
      this._errorCount++;
    }else{
      this._errorCount = 1;
      this._errorUrl = this.currentAudioInfo!.url;
    }

    this.logger.warn(`Playback failed (${this._errorCount}times)`);
    this.preparing = false;
    this.stop({ force: true }).catch(this.logger.error);
    if(this._errorCount >= this.retryLimit){
      if(this.server.queue.loopEnabled) this.server.queue.loopEnabled = false;
      if(this.server.queue.length === 1 && this.server.queue.queueLoopEnabled) this.server.queue.queueLoopEnabled = false;
      await this.server.queue.next();
    }
    await this.play({ quiet: quiet });
  }

  setSleepTimer(currentSong: boolean): void;
  setSleepTimer(timeSeconds: number): void;
  setSleepTimer(arg: boolean | number): void {
    if(typeof arg === "boolean"){
      this._sleeptimerCurrentSong = arg;
      this.clearSleepTimerTimeout();
      return;
    }

    this._sleeptimerCurrentSong = false;
    const timeSeconds = arg;

    if(timeSeconds < 0){
      throw new Error("timeSeconds must be positive number");
    }else if(timeSeconds === 0){
      this.clearSleepTimerTimeout();
      return;
    }

    if(this._sleeptimerTimeout){
      clearTimeout(this._sleeptimerTimeout);
    }

    this._sleeptimerTimeout = setTimeout(async () => {
      await this.sendSleepMessage();

      await this.disconnect().catch(this.logger.error);
    }, timeSeconds * 1000).unref();
  }

  protected clearSleepTimerTimeout(){
    if(this._sleeptimerTimeout){
      clearTimeout(this._sleeptimerTimeout);
      this._sleeptimerTimeout = null;
    }
  }

  protected async sendSleepMessage(){
    await this.server.bot.client.rest.channels.createMessage(this.server.boundTextChannel, {
      content: `:zzz: ${i18next.t("commands:sleeptimer.slept")}`,
    }).catch(this.logger.error);
  }

  override emit<U extends keyof PlayManagerEvents>(event: U, ...args: PlayManagerEvents[U]): boolean {
    super.emit("all", ...args);
    return super.emit(event, ...args);
  }
}

