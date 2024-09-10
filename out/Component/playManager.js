"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayManager = void 0;
const tslib_1 = require("tslib");
const voice_1 = require("@discordjs/voice");
const voice_2 = require("@discordjs/voice");
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const i18next_1 = tslib_1.__importDefault(require("i18next"));
const oceanic_js_1 = require("oceanic.js");
const audioResource_1 = require("./audioResource");
const deferredMessage_1 = require("./deferredMessage");
const streams_1 = require("./streams");
const dsl_1 = require("./streams/dsl");
const normalizer_1 = require("./streams/normalizer");
const Structure_1 = require("../Structure");
const Util = tslib_1.__importStar(require("../Util"));
const color_1 = require("../Util/color");
const decorators_1 = require("../Util/decorators");
const config_1 = require("../config");
const GuildPreferences_1 = require("../types/GuildPreferences");
const config = (0, config_1.getConfig)();
/**
 * サーバーごとの再生を管理するマネージャー。
 * 再生や一時停止などの処理を行います。
 */
let PlayManager = (() => {
    var _a;
    let _classSuper = Structure_1.ServerManagerBase;
    let _instanceExtraInitializers = [];
    let _play_decorators;
    return _a = class PlayManager extends _classSuper {
            get preparing() {
                return this._preparing;
            }
            set preparing(val) {
                this._preparing = val;
            }
            get currentAudioInfo() {
                return this._currentAudioInfo;
            }
            get currentAudioUrl() {
                if (this.currentAudioInfo)
                    return this.currentAudioInfo.url;
                else
                    return "";
            }
            get cost() {
                return this._cost;
            }
            /**
             *  接続され、再生途中にあるか（たとえ一時停止されていても）
             */
            get isPlaying() {
                return this.isConnecting
                    && !!this._player
                    && (this._player.state.status === voice_2.AudioPlayerStatus.Playing || this._player.state.status === voice_2.AudioPlayerStatus.Paused || !!this._waitForLiveAbortController);
            }
            /**
             *  VCに接続中かどうか
             */
            get isConnecting() {
                return !!this.server.connection && this.server.connection.state.status === voice_2.VoiceConnectionStatus.Ready;
            }
            /**
             * 一時停止されているか
             */
            get isPaused() {
                return this.isConnecting && !!this._player && this._player.state.status === voice_2.AudioPlayerStatus.Paused;
            }
            /**
             *  現在ストリーミングした時間(ミリ秒!)
             * @remarks ミリ秒単位なので秒に直すには1000分の一する必要がある
             */
            get currentTime() {
                if (!this.isPlaying || this._player.state.status === voice_2.AudioPlayerStatus.Idle || this._player.state.status === voice_2.AudioPlayerStatus.Buffering) {
                    return 0;
                }
                return this._seek * 1000 + this._player.state.playbackDuration;
            }
            get volume() {
                return this._volume;
            }
            /** 再生終了時に、アイドル状態のままボイスチャンネルに接続したままになってるかどうかを取得します */
            get finishTimeout() {
                return this._finishTimeout;
            }
            get isWaiting() {
                return !!this._waitForLiveAbortController;
            }
            // コンストラクタ
            constructor(parent) {
                super("PlayManager", parent);
                this.retryLimit = (tslib_1.__runInitializers(this, _instanceExtraInitializers), 3);
                this._seek = 0;
                this._errorReportChannel = null;
                this._volume = 100;
                this._errorCount = 0;
                this._errorUrl = "";
                this._preparing = false;
                this._currentAudioInfo = null;
                this._currentAudioStream = null;
                this._cost = 0;
                this._finishTimeout = false;
                this._player = null;
                this._resource = null;
                this._waitForLiveAbortController = null;
                this._dsLogger = null;
                this._playing = false;
                this._lastMember = null;
                this._sleeptimerCurrentSong = false;
                this._sleeptimerTimeout = null;
                this.logger.info("PlayManager instantiated.");
            }
            setVolume(val) {
                this._volume = val;
                if (this._resource?.volumeTransformer) {
                    this._resource.volumeTransformer.setVolumeLogarithmic(val / 100);
                    return true;
                }
                return false;
            }
            /**
             *  再生します
             */
            async play(options = {}) {
                let time = options.time || 0;
                const quiet = options.quiet || false;
                this.emit("playCalled", time);
                // 再生できる状態か確認
                if (this.getIsBadCondition()) {
                    this.logger.warn("#play called but operated nothing");
                    return this;
                }
                this.logger.info("#play called");
                this.emit("playPreparing", time);
                this.preparing = true;
                let messageSendingScheduledAt = null;
                let message = null;
                this._currentAudioInfo = this.server.queue.get(0).basicInfo;
                const [min, sec] = Util.time.calcMinSec(this.currentAudioInfo.lengthSeconds);
                const isYT = this.currentAudioInfo.isYouTube();
                const isLive = isYT && this.currentAudioInfo.isLiveStream;
                if (isYT && this.currentAudioInfo.availableAfter) {
                    const waitTarget = this.currentAudioInfo;
                    // まだ始まっていないライブを待機する
                    message = this.getNoticeNeeded() && !quiet && await this.server.bot.client.rest.channels.createMessage(this.server.boundTextChannel, {
                        content: `:stopwatch:${i18next_1.default.t("components:play.waitingForLiveStream", {
                            lng: this.server.locale,
                            title: this.currentAudioInfo.title,
                        })}`,
                    }) || null;
                    this.preparing = false;
                    const abortController = this._waitForLiveAbortController = new AbortController();
                    this.once("stop", () => {
                        abortController.abort();
                    });
                    await waitTarget.waitForLive(abortController.signal, () => {
                        if (waitTarget !== this._currentAudioInfo) {
                            abortController.abort();
                        }
                    });
                    if (abortController.signal.aborted) {
                        this._waitForLiveAbortController = null;
                        const content = `:white_check_mark: ${i18next_1.default.t("components:play.waitingForLiveCanceled", { lng: this.server.locale })}`;
                        if (message) {
                            message.edit({ content }).catch(this.logger.error);
                        }
                        else {
                            this.server.bot.client.rest.channels.createMessage(this.server.boundTextChannel, { content }).catch(this.logger.error);
                        }
                        return this;
                    }
                    this._waitForLiveAbortController = null;
                    this.preparing = true;
                }
                else if (this.getNoticeNeeded() && !quiet && this.server.preferences.nowPlayingNotificationLevel !== GuildPreferences_1.NowPlayingNotificationLevel.Disable) {
                    // 通知メッセージを送信する（可能なら）
                    message = deferredMessage_1.DeferredMessage.create(this.server.bot.client.getChannel(this.server.boundTextChannel)
                        || await this.server.bot.client.rest.channels.get(this.server.boundTextChannel), 2.5e3, {
                        content: `:hourglass_flowing_sand:${i18next_1.default.t("components:play.preparing", {
                            title: `\`${this.currentAudioInfo.title}\` \`(${isLive ? i18next_1.default.t("liveStream", { lng: this.server.locale }) : `${min}:${sec}`})\``,
                            lng: this.server.locale,
                        })}...`,
                        flags: this.server.preferences.nowPlayingNotificationLevel === GuildPreferences_1.NowPlayingNotificationLevel.Silent
                            ? oceanic_js_1.MessageFlags.SUPPRESS_NOTIFICATIONS
                            : 0,
                    })
                        .on("error", this.logger.error)
                        .on("debug", this.logger.debug);
                    messageSendingScheduledAt = Date.now();
                }
                // try...catchブロックに入る前に、エラーレポートチャンネルを決定しておく
                this._errorReportChannel = message?.channel
                    || this.server.bot.client.getChannel(this.server.boundTextChannel)
                    || await this.server.bot.client.rest.channels.get(this.server.boundTextChannel);
                try {
                    // シーク位置を確認
                    if (this.currentAudioInfo.lengthSeconds <= time)
                        time = 0;
                    this._seek = time;
                    // QueueContentからストリーム情報を取得
                    const rawStream = await this.currentAudioInfo.fetch(time > 0);
                    // 情報からストリームを作成
                    // 万が一ストリームのfetch中に切断された場合には、リソース開放してplayを抜ける
                    const voiceChannel = this.server.connectingVoiceChannel;
                    if (!voiceChannel) {
                        if (rawStream.type === "readable") {
                            rawStream.stream.once("error", () => { });
                            rawStream.stream.destroy();
                        }
                        return this;
                    }
                    const { stream, streamType, cost, streams } = await (0, streams_1.resolveStreamToPlayable)(rawStream, {
                        effects: this.server.audioEffects.export(),
                        seek: this._seek,
                        volumeTransformEnabled: this.volume !== 100,
                        bitrate: voiceChannel.bitrate,
                    });
                    this._currentAudioStream = stream;
                    // ログ
                    if (process.env.DSL_ENABLE) {
                        this._dsLogger = new dsl_1.DSL({ enableFileLog: true });
                        this._dsLogger.appendReadable(...streams);
                    }
                    // 各種準備
                    this._cost = cost;
                    this._lastMember = null;
                    this.prepareAudioPlayer();
                    const normalizer = new normalizer_1.Normalizer(stream, this.volume !== 100);
                    normalizer.once("end", this.onStreamFinished.bind(this));
                    const resource = this._resource = audioResource_1.FixedAudioResource.fromAudioResource((0, voice_2.createAudioResource)(normalizer, {
                        inputType: streamType === "webm/opus"
                            ? voice_2.StreamType.WebmOpus
                            : streamType === "ogg/opus"
                                ? voice_2.StreamType.OggOpus
                                : streamType === "raw"
                                    ? voice_2.StreamType.Raw
                                    : streamType === "opus"
                                        ? voice_2.StreamType.Opus
                                        : voice_2.StreamType.Arbitrary,
                        inlineVolume: this.volume !== 100,
                    }), this.currentAudioInfo.lengthSeconds - time);
                    this._dsLogger?.appendReadable(normalizer);
                    // start to play!
                    this._player.play(resource);
                    // setup volume
                    this.setVolume(this.volume);
                    // wait for player entering the playing state
                    const waitingSucceeded = await (0, voice_2.entersState)(this._player, voice_2.AudioPlayerStatus.Playing, 30e3)
                        .then(() => true)
                        .catch(() => false);
                    if (this._player?.state.status === voice_2.AudioPlayerStatus.Buffering) {
                        throw new Error("Resource timeout exceeded.");
                    }
                    // when occurring one or more error(s) while waiting for player,
                    // the error(s) should be also emitted from AudioPlayer and handled by PlayManager#handleError
                    // so simply ignore the error(s) here.
                    if (!waitingSucceeded) {
                        if (message instanceof deferredMessage_1.DeferredMessage) {
                            message.cancelSchedule();
                        }
                        return this;
                    }
                    this.preparing = false;
                    this._playing = true;
                    this.emit("playStarted");
                    this.logger.info("Playback started successfully");
                    // 現在再生中パネルを送信していい環境な場合に以下のブロックを実行する
                    if (message) {
                        // 再生開始メッセージ
                        const messageContent = this.createNowPlayingMessage();
                        this.logger.debug(`Preparing elapsed time: ${Date.now() - messageSendingScheduledAt}ms`);
                        const replyMessage = await message.edit({
                            ...messageContent,
                            flags: this.server.preferences.nowPlayingNotificationLevel === GuildPreferences_1.NowPlayingNotificationLevel.Silent
                                ? oceanic_js_1.MessageFlags.SUPPRESS_NOTIFICATIONS
                                : 0,
                        }).catch(er => {
                            this.logger.error(er);
                            return null;
                        });
                        // エラー等でmessageがnullになっている場合は何もしない
                        if (replyMessage) {
                            this.eitherOnce(["playCompleted", "handledError", "stop"], () => {
                                replyMessage.edit({
                                    components: [],
                                }).catch(this.logger.error);
                            });
                        }
                    }
                    // ラジオが有効になっている場合、次の曲を準備する
                    if (this.server.queue.mixPlaylistEnabled
                        && this.server.queue.get(0).additionalInfo.addedBy.userId === "2"
                        && this.server.queue.filter(item => item.additionalInfo.addedBy.userId === "2").length <= 2) {
                        await this.server.queue.prepareNextMixItem();
                    }
                    // 条件に合致した場合、次の曲をプリフェッチする
                    if (this.server.queue.length >= 2 && this.currentAudioInfo.lengthSeconds <= 7200 /* 2 * 60 * 60 */) {
                        const nextSong = this.server.queue.get(1);
                        if (nextSong.basicInfo.isYouTube()) {
                            this.logger.info("Prefetching next song beforehand.");
                            await nextSong.basicInfo.refreshInfo({ forceCache: true, onlyIfNoCache: true }).catch(this.logger.error);
                        }
                    }
                }
                catch (e) {
                    if (message instanceof deferredMessage_1.DeferredMessage) {
                        message.cancelSchedule();
                    }
                    this.handleError(e).catch(this.logger.error);
                }
                finally {
                    this.preparing = false;
                }
                return this;
            }
            createNowPlayingMessage() {
                if (!this.currentAudioInfo) {
                    throw new Error("Current audio info was null.");
                }
                const _t = Number(this.currentAudioInfo.lengthSeconds);
                const [min, sec] = Util.time.calcMinSec(_t);
                const queueTimeFragments = Util.time.calcHourMinSec(this.server.queue.lengthSecondsActual - (this.currentAudioInfo.lengthSeconds >= 0 ? this.currentAudioInfo.lengthSeconds : 0));
                /* eslint-disable @typescript-eslint/indent */
                const embed = new helper_1.MessageEmbedBuilder()
                    .setTitle(`:cd: ${i18next_1.default.t("components:nowplaying.nowplayingTitle", { lng: this.server.locale })}${this.currentAudioInfo.isYouTube() ? this.currentAudioInfo.getStrategyIndicator() : ""} :musical_note:`)
                    .setDescription((this.currentAudioInfo.isPrivateSource
                    ? `${this.currentAudioInfo.title} \``
                    : `[${this.currentAudioInfo.title}](${this.currentAudioUrl}) \``)
                    + (this.currentAudioInfo.isYouTube() && this.currentAudioInfo.isLiveStream
                        ? `(${i18next_1.default.t("liveStream", { lng: this.server.locale })})`
                        : _t === 0 ? `(${i18next_1.default.t("unknown", { lng: this.server.locale })})` : min + ":" + sec)
                    + "`")
                    .setColor((0, color_1.getColor)("AUTO_NP"))
                    .addField(i18next_1.default.t("components:nowplaying.requestedBy", { lng: this.server.locale }), this.server.queue.get(0).additionalInfo.addedBy.displayName, true)
                    .addField(i18next_1.default.t("components:nowplaying.nextSong", { lng: this.server.locale }), 
                // トラックループオンなら現在の曲
                this.server.queue.loopEnabled ? this.server.queue.get(0).basicInfo.title
                    // (トラックループはオフ)長さが2以上ならオフセット1の曲
                    : this.server.queue.length >= 2 ? this.server.queue.get(1).basicInfo.title
                        // (トラックループオフ,長さ1)キューループがオンなら現在の曲
                        : this.server.queue.queueLoopEnabled ? this.server.queue.get(0).basicInfo.title
                            // (トラックループオフ,長さ1,キューループオフ)次の曲はなし
                            : i18next_1.default.t("components:nowplaying.noNextSong", { lng: this.server.locale }), true)
                    .addField(i18next_1.default.t("components:play.songsInQueue", { lng: this.server.locale }), this.server.queue.loopEnabled
                    ? i18next_1.default.t("components:play.willLoop", { lng: this.server.locale })
                    : `${i18next_1.default.t("currentSongCount", {
                        count: this.server.queue.length - 1,
                        lng: this.server.locale,
                    })}(${Util.time.HourMinSecToString(queueTimeFragments, i18next_1.default.getFixedT(this.server.locale))})`
                        + (this.server.queue.mixPlaylistEnabled ? `(${i18next_1.default.t("components:nowplaying.inRadio")})` : ""), true);
                if (typeof this.currentAudioInfo.thumbnail === "string") {
                    embed.setThumbnail(this.currentAudioInfo.thumbnail);
                }
                else {
                    embed.setThumbnail("attachment://thumbnail." + this.currentAudioInfo.thumbnail.ext);
                }
                /* eslint-enable @typescript-eslint/indent */
                if (this.currentAudioInfo.isYouTube()) {
                    if (this.currentAudioInfo.isFallbacked) {
                        embed.addField(`:warning: ${i18next_1.default.t("attention", { lng: this.server.locale })}`, i18next_1.default.t("components:queue.fallbackNotice", { lng: this.server.locale }));
                    }
                }
                this.emit("playStartUIPrepared", embed);
                const components = [
                    new helper_1.MessageActionRowBuilder()
                        .addComponents(new helper_1.MessageButtonBuilder()
                        .setCustomId("control_rewind")
                        .setEmoji("⏮️")
                        .setLabel(i18next_1.default.t("components:controlPanel.rewind", { lng: this.server.locale }))
                        .setStyle("SECONDARY"), new helper_1.MessageButtonBuilder()
                        .setCustomId("control_playpause")
                        .setEmoji("⏯️")
                        .setLabel(`${i18next_1.default.t("components:controlPanel.play", { lng: this.server.locale })}/${i18next_1.default.t("components:controlPanel.pause", { lng: this.server.locale })}`)
                        .setStyle("PRIMARY"), new helper_1.MessageButtonBuilder()
                        .setCustomId("control_skip")
                        .setEmoji("⏭️")
                        .setLabel(i18next_1.default.t("components:controlPanel.skip", { lng: this.server.locale }))
                        .setStyle("SECONDARY"), new helper_1.MessageButtonBuilder()
                        .setCustomId("control_onceloop")
                        .setEmoji("🔂")
                        .setLabel(i18next_1.default.t("components:controlPanel.onceloop", { lng: this.server.locale }))
                        .setStyle("SECONDARY"))
                        .toOceanic(),
                ];
                if (typeof this.currentAudioInfo.thumbnail === "string") {
                    return {
                        content: "",
                        embeds: [embed.toOceanic()],
                        components,
                    };
                }
                else {
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
            prepareAudioPlayer() {
                if (this._player || !this.server.connection)
                    return;
                this._player = (0, voice_2.createAudioPlayer)({
                    debug: config.debug,
                    behaviors: {
                        noSubscriber: voice_1.NoSubscriberBehavior.Pause,
                    },
                });
                if (config.debug) {
                    this._player.on("debug", message => this.logger.trace(`[InternalAudioPlayer] ${message}`));
                }
                this._player.on("error", this.handleError.bind(this));
                this._player.on(voice_2.AudioPlayerStatus.Idle, (oldState) => {
                    if (oldState.status === voice_2.AudioPlayerStatus.Playing) {
                        this.emit("reportPlaybackDuration", oldState.playbackDuration, this._errorUrl === this.currentAudioUrl ? this._errorCount : 0);
                    }
                });
                this.server.connection.subscribe(this._player);
            }
            getIsBadCondition() {
                if (config.debug) {
                    this.logger.debug(`Condition: { connecting: ${this.isConnecting}, playing: ${this.isPlaying}, empty: ${this.server.queue.isEmpty}, preparing: ${this.preparing} }`);
                }
                // 再生できる状態か確認
                return /* 接続していない */ !this.isConnecting
                    // なにかしら再生中
                    || this.isPlaying
                    // キューが空
                    || this.server.queue.isEmpty
                    // 準備中
                    || this.preparing;
            }
            getNoticeNeeded() {
                return !!this.server.boundTextChannel;
            }
            /**
             * 停止します。切断するにはDisconnectを使用してください。
             * @returns this
            */
            async stop({ force = false, wait = false } = {}) {
                this.logger.info("Stop called");
                this._playing = false;
                if (this.server.connection) {
                    this._cost = 0;
                    if (this._player) {
                        this._player.unpause();
                        this._player.stop(force);
                        if (wait) {
                            await (0, voice_2.entersState)(this._player, voice_2.AudioPlayerStatus.Idle, 10e3).catch(() => {
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
            async disconnect() {
                await this.stop({ force: true });
                this.emit("disconnectAttempt");
                if (this.server.connection) {
                    this.logger.info("Disconnected from " + this.server.connectingVoiceChannel.id);
                    this.server.connection.disconnect();
                    this.server.connection.destroy();
                    this.emit("disconnect");
                }
                else {
                    this.logger.warn("Disconnect called but no connection");
                }
                // attempt to destroy current stream
                this.destroyStream();
                this.server.connection = null;
                this.server.connectingVoiceChannel = null;
                this._player = null;
                this._sleeptimerCurrentSong = false;
                this.clearSleepTimerTimeout();
                if (typeof global.gc === "function") {
                    global.gc();
                    this.logger.info("Called exposed gc");
                }
                return this;
            }
            destroyStream() {
                if (this._currentAudioStream) {
                    if (!this._currentAudioStream.destroyed) {
                        this._currentAudioStream.destroy();
                    }
                    this._currentAudioStream = null;
                    if (this._resource) {
                        this._resource = null;
                    }
                    this._dsLogger?.destroy();
                }
            }
            /**
             * 一時停止します。
             * @returns this
             */
            pause(lastMember) {
                this.logger.info("Pause called");
                this.emit("pause");
                this._player.pause();
                this._lastMember = lastMember?.id || null;
                return this;
            }
            /**
             * 一時停止再生します。
             * @returns this
             */
            resume(member) {
                this.logger.info("Resume called");
                this.emit("resume");
                if (!member || member.id === this._lastMember) {
                    this._player.unpause();
                    this._lastMember = null;
                }
                return this;
            }
            /**
             * 頭出しをします。
             * @returns this
             */
            async rewind() {
                this.logger.info("Rewind called");
                this.emit("rewind");
                await this.stop({ wait: true });
                await this.play().catch(this.logger.error);
                return this;
            }
            async handleError(er) {
                this.logger.error(er);
                this.emit("handledError", er);
                if (er instanceof Error) {
                    if ("type" in er && er.type === "workaround") {
                        this
                            .onStreamFailed(/* quiet */ true)
                            .catch(this.logger.error);
                        return;
                    }
                }
                await this._errorReportChannel?.createMessage({
                    content: `:tired_face:${i18next_1.default.t("components:play.failedToPlay", { lng: this.server.locale })}`
                        + (this._errorCount + 1 >= this.retryLimit
                            ? i18next_1.default.t("components:play.failedAndSkipping", { lng: this.server.locale })
                            : i18next_1.default.t("components:play.failedAndRetrying", { lng: this.server.locale })),
                });
                await this.onStreamFailed();
            }
            resetError() {
                this._errorCount = 0;
                this._errorUrl = "";
            }
            async onStreamFinished() {
                // 再生状態でないときに発生したエラーは基本的に無視する
                if (!this.currentAudioUrl || !this._playing) {
                    // ただし、ストリームの準備中に発生したエラーはエラーハンドリングして再試行に回す
                    if (this.preparing) {
                        await this.handleError(new Error("Something went wrong while playing stream"));
                    }
                    return;
                }
                this._playing = false;
                this.logger.info("onStreamFinished called");
                // まだ状態が再生中のままであるときには、再生停止中になるまで、最大20秒間待機する
                if (this.server.connection && this._player?.state.status === voice_2.AudioPlayerStatus.Playing) {
                    await (0, voice_2.entersState)(this._player, voice_2.AudioPlayerStatus.Idle, 20e3)
                        .catch(() => {
                        this.logger.warn("Stream has not ended in time and will force stream into destroying");
                        return this.stop({ force: true });
                    });
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
                if (this._sleeptimerCurrentSong) {
                    if (!this.server.queue.loopEnabled && !this.server.queue.queueLoopEnabled) {
                        await this.server.queue.next();
                    }
                    await this.sendSleepMessage();
                    await this.disconnect().catch(this.logger.error);
                    return;
                }
                if (this.server.queue.loopEnabled) {
                    // 曲ループオンならばもう一度再生
                    await this.play();
                }
                else if (this.server.queue.onceLoopEnabled) {
                    // ワンスループが有効ならもう一度同じものを再生
                    this.server.queue.onceLoopEnabled = false;
                    await this.play();
                }
                else {
                    // キュー整理
                    await this.server.queue.next();
                    // キューがなくなったら接続終了
                    if (this.server.queue.isEmpty) {
                        await this.onQueueEmpty();
                    }
                    else {
                        // なくなってないなら再生開始！
                        await this.play();
                    }
                }
            }
            async onQueueEmpty() {
                this.logger.info("Queue empty");
                this.destroyStream();
                // 紐づけチャンネルが存在する場合、キューが空になった旨をレポートする
                if (this.server.boundTextChannel) {
                    await this.server.bot.client.rest.channels
                        .createMessage(this.server.boundTextChannel, {
                        content: `:upside_down:${i18next_1.default.t("components:play.queueEmpty", { lng: this.server.locale })}`,
                    })
                        .catch(this.logger.error);
                }
                const timer = setTimeout(() => {
                    // unset event handler
                    this.off("playCalled", clearFinishTimeout);
                    this.off("disconnectAttempt", clearFinishTimeout);
                    this._finishTimeout = false;
                    if (this.server.boundTextChannel) {
                        this.server.bot.client.rest.channels
                            .createMessage(this.server.boundTextChannel, {
                            content: `:wave:${i18next_1.default.t("components:play.queueEmptyAndExiting", { lng: this.server.locale })}`,
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
            async onStreamFailed(quiet = false) {
                this._playing = false;
                this.logger.info("onStreamFailed called");
                this.emit("playFailed");
                this._cost = 0;
                this.destroyStream();
                this.currentAudioInfo.purgeCache();
                if (this._errorUrl === this.currentAudioInfo.url && !quiet) {
                    this._errorCount++;
                }
                else {
                    this._errorCount = 1;
                    this._errorUrl = this.currentAudioInfo.url;
                }
                this.logger.warn(`Playback failed (${this._errorCount}times)`);
                this.preparing = false;
                this.stop({ force: true }).catch(this.logger.error);
                if (this._errorCount >= this.retryLimit) {
                    if (this.server.queue.loopEnabled)
                        this.server.queue.loopEnabled = false;
                    if (this.server.queue.length === 1 && this.server.queue.queueLoopEnabled)
                        this.server.queue.queueLoopEnabled = false;
                    await this.server.queue.next();
                }
                await this.play({ quiet: quiet });
            }
            setSleepTimer(arg) {
                if (typeof arg === "boolean") {
                    this._sleeptimerCurrentSong = arg;
                    this.clearSleepTimerTimeout();
                    return;
                }
                this._sleeptimerCurrentSong = false;
                const timeSeconds = arg;
                if (timeSeconds < 0) {
                    throw new Error("timeSeconds must be positive number");
                }
                else if (timeSeconds === 0) {
                    this.clearSleepTimerTimeout();
                    return;
                }
                if (this._sleeptimerTimeout) {
                    clearTimeout(this._sleeptimerTimeout);
                }
                this._sleeptimerTimeout = setTimeout(async () => {
                    await this.sendSleepMessage();
                    await this.disconnect().catch(this.logger.error);
                }, timeSeconds * 1000).unref();
            }
            clearSleepTimerTimeout() {
                if (this._sleeptimerTimeout) {
                    clearTimeout(this._sleeptimerTimeout);
                    this._sleeptimerTimeout = null;
                }
            }
            async sendSleepMessage() {
                await this.server.bot.client.rest.channels.createMessage(this.server.boundTextChannel, {
                    content: `:zzz: ${i18next_1.default.t("commands:sleeptimer.slept")}`,
                }).catch(this.logger.error);
            }
            emit(event, ...args) {
                super.emit("all", ...args);
                return super.emit(event, ...args);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _play_decorators = [decorators_1.measureTime];
            tslib_1.__esDecorate(_a, null, _play_decorators, { kind: "method", name: "play", static: false, private: false, access: { has: obj => "play" in obj, get: obj => obj.play }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.PlayManager = PlayManager;
//# sourceMappingURL=playManager.js.map