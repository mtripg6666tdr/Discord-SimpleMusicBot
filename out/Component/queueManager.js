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
exports.QueueManager = void 0;
const tslib_1 = require("tslib");
const async_lock_1 = require("@mtripg6666tdr/async-lock");
const oceanic_command_resolver_1 = require("@mtripg6666tdr/oceanic-command-resolver");
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const i18next_1 = tslib_1.__importDefault(require("i18next"));
const oceanic_js_1 = require("oceanic.js");
const yt_mix_playlist_1 = tslib_1.__importDefault(require("yt-mix-playlist"));
const deferredMessage_1 = require("./deferredMessage");
const AudioSource = tslib_1.__importStar(require("../AudioSource"));
const Commands_1 = require("../Commands");
const Structure_1 = require("../Structure");
const Util = tslib_1.__importStar(require("../Util"));
const color_1 = require("../Util/color");
const decorators_1 = require("../Util/decorators");
const decorators_2 = require("../Util/decorators");
const config_1 = require("../config");
const config = (0, config_1.getConfig)();
/**
 * サーバーごとのキューを管理するマネージャー。
 * キューの追加および削除などの機能を提供します。
 */
let QueueManager = (() => {
    var _a, _QueueManager_loopEnabled_accessor_storage, _QueueManager_queueLoopEnabled_accessor_storage, _QueueManager_onceLoopEnabled_accessor_storage;
    let _classSuper = Structure_1.ServerManagerBase;
    let _instanceExtraInitializers = [];
    let _loopEnabled_decorators;
    let _loopEnabled_initializers = [];
    let _loopEnabled_extraInitializers = [];
    let _queueLoopEnabled_decorators;
    let _queueLoopEnabled_initializers = [];
    let _queueLoopEnabled_extraInitializers = [];
    let _onceLoopEnabled_decorators;
    let _onceLoopEnabled_initializers = [];
    let _onceLoopEnabled_extraInitializers = [];
    let _addQueueOnly_decorators;
    let _addQueue_decorators;
    let _processPlaylist_decorators;
    let _disableMixPlaylist_decorators;
    return _a = class QueueManager extends _classSuper {
            /**
             * キューの本体のゲッタープロパティ
             */
            get default() {
                return this._default;
            }
            /**
             * トラックループが有効かどうか
             */
            get loopEnabled() { return tslib_1.__classPrivateFieldGet(this, _QueueManager_loopEnabled_accessor_storage, "f"); }
            set loopEnabled(value) { tslib_1.__classPrivateFieldSet(this, _QueueManager_loopEnabled_accessor_storage, value, "f"); }
            /**
             * キューループが有効かどうか
             */
            get queueLoopEnabled() { return tslib_1.__classPrivateFieldGet(this, _QueueManager_queueLoopEnabled_accessor_storage, "f"); }
            set queueLoopEnabled(value) { tslib_1.__classPrivateFieldSet(this, _QueueManager_queueLoopEnabled_accessor_storage, value, "f"); }
            /**
             * ワンスループが有効かどうか
             */
            get onceLoopEnabled() { return tslib_1.__classPrivateFieldGet(this, _QueueManager_onceLoopEnabled_accessor_storage, "f"); }
            set onceLoopEnabled(value) { tslib_1.__classPrivateFieldSet(this, _QueueManager_onceLoopEnabled_accessor_storage, value, "f"); }
            /**
             * キューの長さ（トラック数）
             */
            get length() {
                return this.default.length;
            }
            /**
             * プライベートトラックを除いたキューの長さ（トラック数）
             */
            get publicLength() {
                return this.default.reduce((prev, current) => prev + (current.basicInfo.isPrivateSource ? 0 : 1), 0);
            }
            /**
             * キューの長さ（時間秒）
             * ライブストリームが含まれていた場合、NaNとなります
             */
            get lengthSeconds() {
                return this.default.reduce((prev, current) => prev + Number(current.basicInfo.lengthSeconds), 0);
            }
            /**
             * 現在取得できる限りのキューの長さ(時間秒)
             */
            get lengthSecondsActual() {
                return this.default.reduce((prev, current) => prev + Number(current.basicInfo.lengthSeconds || 0), 0);
            }
            get isEmpty() {
                return this.length === 0;
            }
            get mixPlaylist() {
                return this._mixPlaylist;
            }
            set mixPlaylist(value) {
                const oldState = this.mixPlaylistEnabled;
                this._mixPlaylist = value;
                const newState = this.mixPlaylistEnabled;
                if (newState !== oldState) {
                    this.emit("mixPlaylistEnabledChanged", newState);
                }
            }
            get mixPlaylistEnabled() {
                return !!this._mixPlaylist;
            }
            constructor(parent) {
                super("QueueManager", parent);
                /**
                 * キューの本体
                 */
                this._default = (tslib_1.__runInitializers(this, _instanceExtraInitializers), []);
                _QueueManager_loopEnabled_accessor_storage.set(this, tslib_1.__runInitializers(this, _loopEnabled_initializers, void 0));
                _QueueManager_queueLoopEnabled_accessor_storage.set(this, (tslib_1.__runInitializers(this, _loopEnabled_extraInitializers), tslib_1.__runInitializers(this, _queueLoopEnabled_initializers, void 0)));
                _QueueManager_onceLoopEnabled_accessor_storage.set(this, (tslib_1.__runInitializers(this, _queueLoopEnabled_extraInitializers), tslib_1.__runInitializers(this, _onceLoopEnabled_initializers, void 0)));
                this._mixPlaylist = tslib_1.__runInitializers(this, _onceLoopEnabled_extraInitializers);
                this.addQueueLocker = new async_lock_1.LockObj();
                this.logger.info("QueueManager initialized.");
            }
            /**
             * キュー内の指定されたインデックスの内容を返します
             * @param index インデックス
             * @returns 指定された位置にあるキューコンテンツ
             */
            get(index) {
                return this.default[index];
            }
            /**
             * キュー内で与えられた条件に適合するものを配列として返却します
             * @param predicate 条件を表す関数
             * @returns 条件に適合した要素の配列
             */
            filter(predicate, thisArg) {
                return this.default.filter(predicate, thisArg);
            }
            /**
             * キュー内のコンテンツから与えられた条件に一致する最初の要素のインデックスを返却します
             * @param predicate 条件
             * @returns インデックス
             */
            findIndex(predicate, thisArg) {
                return this.default.findIndex(predicate, thisArg);
            }
            /**
             * キュー内のコンテンツのすべてで与えられた関数を実行し結果を配列として返却します
             * @param callbackfn 変換する関数
             * @returns 変換後の配列
             */
            map(callbackfn, thisArg) {
                return this.default.map(callbackfn, thisArg);
            }
            /**
             * キュー内のコンテンツのすべてで与えられた関数を実行します。
             * @param callbackfn 関数
             */
            forEach(callbackfn, thisArg) {
                this.default.forEach(callbackfn, thisArg);
            }
            getLengthSecondsTo(index) {
                let sec = 0;
                if (index < 0)
                    throw new Error("Invalid argument: " + index);
                const target = Math.min(index, this.length);
                for (let i = 0; i <= target; i++) {
                    sec += this.get(i).basicInfo.lengthSeconds;
                }
                return sec;
            }
            async addQueueOnly({ url, addedBy, method = "push", sourceType = "unknown", gotData = null, preventCache = false, preventSourceCache = false, }) {
                return (0, async_lock_1.lock)(this.addQueueLocker, async () => {
                    this.logger.info("AddQueue called");
                    const result = {
                        basicInfo: await AudioSource.resolve({
                            url,
                            type: sourceType,
                            knownData: gotData,
                            forceCache: !preventCache && (this.length === 0 || method === "unshift" || this.lengthSeconds < 4 * 60 * 60 * 1000),
                        }, this.server.bot.cache, preventSourceCache),
                        additionalInfo: {
                            addedBy: {
                                userId: addedBy && this.getUserIdFromMember(addedBy) || "0",
                                displayName: addedBy?.displayName || i18next_1.default.t("unknown", { lng: this.server.locale }),
                            },
                        },
                    };
                    if (result.basicInfo) {
                        this._default[method](result);
                        if (this.server.preferences.equallyPlayback) {
                            this.sortByAddedBy();
                        }
                        this.emit(method === "push" ? "changeWithoutCurrent" : "change");
                        this.emit("add", result);
                        const index = method === "push" ? this._default.findLastIndex(q => q === result) : this._default.findIndex(q => q === result);
                        this.logger.info(`queue content added at position ${index}`);
                        return { ...result, index };
                    }
                    throw new Error("Provided URL was not resolved as available service");
                });
            }
            /**
             * ユーザーへのインタラクションやキュー追加までを一括して行います
             * @returns 成功した場合はtrue、それ以外の場合はfalse
             */
            async addQueue(options) {
                this.logger.info("AutoAddQueue Called");
                const { t } = (0, Commands_1.getCommandExecutionContext)();
                let uiMessage = null;
                try {
                    // UI表示するためのメッセージを特定する作業
                    if (options.fromSearch) {
                        // 検索パネルからの場合
                        this.logger.info("AutoAddQueue from search panel");
                        uiMessage = options.fromSearch;
                        await uiMessage.edit({
                            content: "",
                            embeds: [
                                new helper_1.MessageEmbedBuilder()
                                    .setTitle(t("pleaseWait"))
                                    .setDescription(`${t("loadingInfo")}...`)
                                    .toOceanic(),
                            ],
                            allowedMentions: {
                                repliedUser: false,
                            },
                            components: [],
                        });
                    }
                    else if (options.message) {
                        // すでに処理中メッセージがある場合
                        this.logger.info("AutoAddQueue will report statuses to the specified message");
                        uiMessage = options.message instanceof oceanic_command_resolver_1.CommandMessage
                            ? deferredMessage_1.DeferredMessage.create(options.message, 2e3, {
                                content: t("loadingInfoPleaseWait"),
                            })
                                .on("error", this.logger.error)
                                .on("debug", this.logger.debug)
                            : options.message;
                    }
                    else if (options.channel) {
                        // まだないの場合（新しくUI用のメッセージを生成する）
                        this.logger.info("AutoAddQueue will make a message that will be used to report statuses");
                        uiMessage = deferredMessage_1.DeferredMessage.create(options.channel, 2e3, {
                            content: t("loadingInfoPleaseWait"),
                        }).on("error", this.logger.error);
                    }
                    // キューの長さ確認
                    if (this.server.queue.length > 999) {
                        // キュー上限
                        this.logger.warn("AutoAddQueue failed due to too long queue");
                        throw new Error(t("components:queue.tooManyQueueItems"));
                    }
                    // キューへの追加を実行
                    const info = await this.server.queue.addQueueOnly({
                        url: options.url,
                        addedBy: options.addedBy,
                        method: options.first ? "unshift" : "push",
                        sourceType: options.sourceType || "unknown",
                        gotData: options.gotData || null,
                        preventSourceCache: options.privateSource,
                    });
                    // 非公開ソースで追加する場合には非公開ソースとしてマーク
                    if (options.privateSource) {
                        info.basicInfo.markAsPrivateSource();
                    }
                    this.logger.info("AutoAddQueue worked successfully");
                    // UIを表示する
                    if (uiMessage) {
                        // 曲の時間取得＆計算
                        const trackLengthSeconds = Number(info.basicInfo.lengthSeconds);
                        const [min, sec] = Util.time.calcMinSec(trackLengthSeconds);
                        // キュー内のオフセット取得
                        const index = info.index.toString();
                        // ETAの計算
                        const timeFragments = Util.time.calcHourMinSec(this.getLengthSecondsTo(info.index) - trackLengthSeconds - Math.floor(this.server.player.currentTime / 1000));
                        // 埋め込みの作成
                        const embed = new helper_1.MessageEmbedBuilder()
                            .setColor((0, color_1.getColor)("SONG_ADDED"))
                            .setTitle(`:white_check_mark: ${t("components:queue.songAdded")}`)
                            .setDescription(info.basicInfo.isPrivateSource ? info.basicInfo.title : `[${info.basicInfo.title}](${info.basicInfo.url})`)
                            .addField(t("length"), info.basicInfo.isYouTube() && info.basicInfo.isLiveStream
                            ? t("liveStream")
                            : trackLengthSeconds !== 0
                                ? min + ":" + sec
                                : t("unknown"), true)
                            .addField(t("components:nowplaying.requestedBy"), options.addedBy?.displayName || t("unknown"), true)
                            .addField(t("components:queue.positionInQueue"), index === "0"
                            ? `${t("components:nowplaying.nowplayingItemName")}/${t("components:nowplaying.waitForPlayingItemName")}`
                            : index, true)
                            .addField(t("components:queue.etaToPlay"), index === "0"
                            ? "-"
                            : timeFragments[2].includes("-")
                                ? t("unknown")
                                : Util.time.HourMinSecToString(timeFragments, t), true);
                        if (info.basicInfo.isYouTube()) {
                            if (info.basicInfo.isFallbacked) {
                                embed.addField(`:warning: ${t("attention")}`, t("components:queue.fallbackNotice"));
                            }
                            else if (info.basicInfo.strategyId === 1) {
                                embed.setTitle(`${embed.title}*`);
                            }
                        }
                        else if (info.basicInfo instanceof AudioSource.Spotify) {
                            embed.addField(`:warning:${t("attention")}`, t("components:queue.spotifyNotice"));
                        }
                        const components = [];
                        // キャンセルボタンの作成
                        const cancellable = !options.first && options.cancellable && !!options.addedBy;
                        let collector = null;
                        if (cancellable) {
                            const collectorCreateResult = this.server.bot.collectors
                                .create()
                                .setAuthorIdFilter(options.addedBy ? this.getUserIdFromMember(options.addedBy) : null)
                                .setTimeout(5 * 60 * 1000)
                                .createCustomIds({
                                cancelLast: "button",
                            });
                            collector = collectorCreateResult.collector;
                            components.push(new helper_1.MessageActionRowBuilder()
                                .addComponents(new helper_1.MessageButtonBuilder()
                                .setCustomId(collectorCreateResult.customIdMap.cancelLast)
                                .setLabel(t("cancel"))
                                .setStyle("DANGER"))
                                .toOceanic());
                            collectorCreateResult.collector.once("cancelLast", interaction => {
                                try {
                                    const item = this.get(info.index);
                                    this.removeAt(info.index);
                                    interaction.createFollowup({
                                        content: `🚮${t("components:queue.cancelAdded", { title: item.basicInfo.title })}`,
                                    }).catch(this.logger.error);
                                }
                                catch (er) {
                                    this.logger.error(er);
                                    interaction.createFollowup({
                                        content: t("errorOccurred"),
                                    }).catch(this.logger.error);
                                }
                            });
                            const destroyCollector = () => {
                                this.off("change", destroyCollector);
                                this.off("changeWithoutCurrent", destroyCollector);
                                collector?.destroy();
                            };
                            this.once("change", destroyCollector);
                            this.once("changeWithoutCurrent", destroyCollector);
                        }
                        let messageContent = null;
                        if (typeof info.basicInfo.thumbnail === "string") {
                            embed.setThumbnail(info.basicInfo.thumbnail);
                            messageContent = {
                                content: "",
                                embeds: [embed.toOceanic()],
                                components,
                            };
                        }
                        else {
                            embed.setThumbnail("attachment://thumbnail." + info.basicInfo.thumbnail.ext);
                            messageContent = {
                                content: "",
                                embeds: [embed.toOceanic()],
                                components,
                                files: [
                                    {
                                        name: "thumbnail." + info.basicInfo.thumbnail.ext,
                                        contents: info.basicInfo.thumbnail.data,
                                    },
                                ],
                            };
                        }
                        const lastReply = await uiMessage.edit(messageContent).catch(this.logger.error);
                        if (lastReply) {
                            collector?.setMessage(lastReply);
                        }
                    }
                    return info;
                }
                catch (e) {
                    this.logger.error("AutoAddQueue failed", e);
                    if (uiMessage) {
                        const errorMessage = "message" in e && typeof e.message === "string"
                            ? e.message
                            : Util.filterContent(Util.stringifyObject(e));
                        const errorMessageContent = {
                            content: `:weary: ${t("components:queue.failedToAdd")}${errorMessage ? `(${errorMessage})` : ""}`,
                            embeds: [],
                        };
                        uiMessage.edit(errorMessageContent).catch(this.logger.error);
                    }
                    return null;
                }
            }
            /**
             * プレイリストを処理します
             * @param client botのクライアント
             * @param msg すでに返信済みの応答メッセージ
             * @param cancellation 処理のキャンセレーションマネージャー
             * @param queue キューマネージャー
             * @param first 最初に追加する場合はtrue、それ以外の場合はfalse
             * @param identifer オーディオソースサービス識別子
             * @param playlist プレイリスト本体。トラックの配列
             * @param title プレイリストのタイトル
             * @param totalCount プレイリストに含まれるトラック数
             * @param exportableConsumer トラックをexportableCustomに処理する関数
             * @returns 追加に成功した楽曲数
             */
            async processPlaylist(msg, cancellation, first, identifer, playlist, title, totalCount, exportableConsumer) {
                let index = 0;
                const result = [];
                for (let i = 0; i < totalCount; i++) {
                    const item = playlist[i];
                    if (!item)
                        continue;
                    const exportable = await exportableConsumer(item);
                    const _result = await this.addQueueOnly({
                        url: exportable.url,
                        addedBy: msg.command.member,
                        sourceType: identifer,
                        method: first ? "unshift" : "push",
                        gotData: exportable,
                    }).catch(this.logger.error);
                    if (_result) {
                        index++;
                        result.push(_result);
                    }
                    if (index % 50 === 0
                        || totalCount <= 50 && index % 10 === 0
                        || totalCount <= 10 && index % 4 === 0) {
                        await msg.edit(`:hourglass_flowing_sand:${i18next_1.default.t("components:queue.processingPlaylist", { title, lng: this.server.locale })}${i18next_1.default.t("pleaseWait", { lng: this.server.locale })}${i18next_1.default.t("default:songProcessingInProgress", {
                            totalSongCount: i18next_1.default.t("default:totalSongCount", { count: totalCount, lng: this.server.locale }),
                            currentSongCount: i18next_1.default.t("default:currentSongCount", { count: index, lng: this.server.locale }),
                            lng: this.server.locale,
                        })}`);
                    }
                    if (cancellation.cancelled) {
                        break;
                    }
                }
                return result;
            }
            /**
             * 次の曲に移動します
             */
            async next() {
                this.logger.info("Next Called");
                this.onceLoopEnabled = false;
                this.server.player.resetError();
                if (this.queueLoopEnabled) {
                    this._default.push(this.default[0]);
                }
                else if (this.server.preferences.addRelated && this.server.player.currentAudioInfo instanceof AudioSource.YouTube) {
                    const relatedVideos = this.server.player.currentAudioInfo.relatedVideos;
                    if (relatedVideos.length >= 1) {
                        const video = relatedVideos[0];
                        if (typeof video === "string") {
                            await this.addQueueOnly({
                                url: video,
                                addedBy: null,
                                method: "push",
                                sourceType: "youtube",
                            });
                        }
                        else {
                            await this.addQueueOnly({
                                url: video.url,
                                addedBy: null,
                                method: "push",
                                sourceType: "youtube",
                                gotData: video,
                            });
                        }
                    }
                }
                this._default.shift();
                this.emit("change");
            }
            async enableMixPlaylist(videoId, request, skipAddingBase = false) {
                this._mixPlaylist = await (0, yt_mix_playlist_1.default)(videoId, {
                    gl: config.country,
                    hl: config.defaultLanguage,
                });
                if (!this.mixPlaylistEnabled) {
                    return false;
                }
                if (!skipAddingBase) {
                    await this.addQueueOnly({
                        url: `https://www.youtube.com/watch?v=${videoId}`,
                        addedBy: request,
                        method: "push",
                        sourceType: "youtube",
                    });
                }
                await this.prepareNextMixItem();
                await this.prepareNextMixItem();
                this.server.player.once("disconnect", this.disableMixPlaylist);
                return true;
            }
            async prepareNextMixItem() {
                if (!this.mixPlaylistEnabled)
                    throw new Error("Mix playlist is currently disabled");
                // select and obtain the next song
                this._mixPlaylist = await this.mixPlaylist.select(this.mixPlaylist.currentIndex + 1);
                const item = this.mixPlaylist.items[this.mixPlaylist.currentIndex];
                // if a new song fetched, add it to the last in queue.
                if (item) {
                    if (!item.url) {
                        return this.prepareNextMixItem();
                    }
                    await this.addQueueOnly({
                        url: item.url,
                        addedBy: {
                            userId: "2",
                        },
                        method: "push",
                        sourceType: "youtube",
                        gotData: {
                            url: item.url,
                            title: item.title,
                            description: "No description due to being fetched via mix-list",
                            length: item.duration.split(":").reduce((prev, current) => prev * 60 + Number(current), 0),
                            channel: item.author?.name || "unknown",
                            channelUrl: item.author?.url || "unknown",
                            thumbnail: item.thumbnails[0].url,
                            isLive: false,
                        },
                    });
                }
                else {
                    this.disableMixPlaylist();
                }
            }
            disableMixPlaylist() {
                this._mixPlaylist = null;
                this.server.player.off("disconnect", this.disableMixPlaylist);
            }
            /**
             * 指定された位置のキューコンテンツを削除します
             * @param offset 位置
             */
            removeAt(offset) {
                if (this.server.player.isPlaying && offset === 0) {
                    throw new Error("The first item cannot be removed because it is being played right now.");
                }
                this.logger.info(`RemoveAt Called (offset:${offset})`);
                this._default.splice(offset, 1);
                if (this.server.preferences.equallyPlayback) {
                    this.sortByAddedBy();
                }
                this.emit(offset === 0 ? "change" : "changeWithoutCurrent");
            }
            /**
             * すべてのキューコンテンツを消去します
             */
            removeAll() {
                this.logger.info("RemoveAll Called");
                this._default = [];
                this.emit("change");
            }
            /**
             * 最初のキューコンテンツだけ残し、残りのキューコンテンツを消去します
             */
            removeFrom2nd() {
                this.logger.info("RemoveFrom2 Called");
                this._default = [this.default[0]];
                this.emit("changeWithoutCurrent");
            }
            /**
             * キューをシャッフルします
             */
            shuffle() {
                this.logger.info("Shuffle Called");
                if (this._default.length === 0)
                    return;
                const addedByOrder = [];
                this._default.forEach(item => {
                    if (!addedByOrder.includes(item.additionalInfo.addedBy.userId)) {
                        addedByOrder.push(item.additionalInfo.addedBy.userId);
                    }
                });
                if (this.server.player.isPlaying || this.server.player.preparing) {
                    // 再生中/準備中には、キューの一番最初のアイテムの位置を変えずにそれ以外をシャッフルする
                    const first = this._default.shift();
                    this._default.sort(() => Math.random() - 0.5);
                    this._default.unshift(first);
                    this.emit("changeWithoutCurrent");
                }
                else {
                    // キュー内のすべてのアイテムをシャッフルする
                    this._default.sort(() => Math.random() - 0.5);
                    this.emit("change");
                }
                if (this.server.preferences.equallyPlayback) {
                    this.sortByAddedBy(addedByOrder);
                }
            }
            /**
             * 条件に一致するキューコンテンツをキューから削除します
             * @param validator 条件を表す関数
             * @returns 削除されたオフセットの一覧
             */
            removeIf(validator) {
                this.logger.info("RemoveIf Called");
                if (this._default.length === 0)
                    return [];
                const first = this.server.player.isPlaying ? 1 : 0;
                const rmIndex = [];
                for (let i = first; i < this._default.length; i++) {
                    if (validator(this._default[i])) {
                        rmIndex.push(i);
                    }
                }
                rmIndex.sort((a, b) => b - a);
                rmIndex.forEach(n => this.removeAt(n));
                this.emit(rmIndex.includes(0) ? "change" : "changeWithoutCurrent");
                return rmIndex;
            }
            /**
             * キュー内で移動します
             * @param from 移動元のインデックス
             * @param to 移動先のインデックス
             */
            move(from, to) {
                this.logger.info("Move Called");
                if (from < to) {
                    //要素追加
                    this._default.splice(to + 1, 0, this.default[from]);
                    //要素削除
                    this._default.splice(from, 1);
                }
                else if (from > to) {
                    //要素追加
                    this._default.splice(to, 0, this.default[from]);
                    //要素削除
                    this._default.splice(from + 1, 1);
                }
                if (this.server.preferences.equallyPlayback) {
                    this.sortByAddedBy();
                }
                this.emit(from === 0 || to === 0 ? "change" : "changeWithoutCurrent");
            }
            /**
             * 追加者によってできるだけ交互になるようにソートします
             */
            sortByAddedBy(addedByUsers) {
                const firstItem = this._default[0];
                if (!firstItem)
                    return;
                // 追加者の一覧とマップを作成
                const generateUserOrder = !addedByUsers;
                addedByUsers = addedByUsers || [];
                const queueByAdded = new Map();
                for (let i = 0; i < this._default.length; i++) {
                    const item = this._default[i];
                    if (generateUserOrder && !addedByUsers.includes(item.additionalInfo.addedBy.userId)) {
                        addedByUsers.push(item.additionalInfo.addedBy.userId);
                    }
                    if (queueByAdded.has(item.additionalInfo.addedBy.userId)) {
                        queueByAdded.get(item.additionalInfo.addedBy.userId).push(item);
                    }
                    else {
                        queueByAdded.set(item.additionalInfo.addedBy.userId, [item]);
                    }
                }
                // ソートをもとにキューを再構築
                const sorted = [];
                const maxLengthByUser = Math.max(...addedByUsers.map(userId => queueByAdded.get(userId)?.length || 0));
                for (let i = 0; i < maxLengthByUser; i++) {
                    sorted.push(...addedByUsers.map(userId => queueByAdded.get(userId)?.[i]).filter(q => !!q));
                }
                this._default = sorted;
                this.emit(this._default[0] === firstItem ? "changeWithoutCurrent" : "change");
            }
            getRawQueueItems() {
                return [...this._default];
            }
            addRawQueueItems(items) {
                this._default.push(...items);
            }
            getUserIdFromMember(member) {
                return member instanceof oceanic_js_1.Member ? member.id : member.userId;
            }
        },
        _QueueManager_loopEnabled_accessor_storage = new WeakMap(),
        _QueueManager_queueLoopEnabled_accessor_storage = new WeakMap(),
        _QueueManager_onceLoopEnabled_accessor_storage = new WeakMap(),
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _loopEnabled_decorators = [(0, decorators_1.emitEventOnMutation)("settingsChanged")];
            _queueLoopEnabled_decorators = [(0, decorators_1.emitEventOnMutation)("settingsChanged")];
            _onceLoopEnabled_decorators = [(0, decorators_1.emitEventOnMutation)("settingsChanged")];
            _addQueueOnly_decorators = [decorators_2.measureTime];
            _addQueue_decorators = [decorators_2.measureTime];
            _processPlaylist_decorators = [decorators_2.measureTime];
            _disableMixPlaylist_decorators = [decorators_1.bindThis];
            tslib_1.__esDecorate(_a, null, _loopEnabled_decorators, { kind: "accessor", name: "loopEnabled", static: false, private: false, access: { has: obj => "loopEnabled" in obj, get: obj => obj.loopEnabled, set: (obj, value) => { obj.loopEnabled = value; } }, metadata: _metadata }, _loopEnabled_initializers, _loopEnabled_extraInitializers);
            tslib_1.__esDecorate(_a, null, _queueLoopEnabled_decorators, { kind: "accessor", name: "queueLoopEnabled", static: false, private: false, access: { has: obj => "queueLoopEnabled" in obj, get: obj => obj.queueLoopEnabled, set: (obj, value) => { obj.queueLoopEnabled = value; } }, metadata: _metadata }, _queueLoopEnabled_initializers, _queueLoopEnabled_extraInitializers);
            tslib_1.__esDecorate(_a, null, _onceLoopEnabled_decorators, { kind: "accessor", name: "onceLoopEnabled", static: false, private: false, access: { has: obj => "onceLoopEnabled" in obj, get: obj => obj.onceLoopEnabled, set: (obj, value) => { obj.onceLoopEnabled = value; } }, metadata: _metadata }, _onceLoopEnabled_initializers, _onceLoopEnabled_extraInitializers);
            tslib_1.__esDecorate(_a, null, _addQueueOnly_decorators, { kind: "method", name: "addQueueOnly", static: false, private: false, access: { has: obj => "addQueueOnly" in obj, get: obj => obj.addQueueOnly }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _addQueue_decorators, { kind: "method", name: "addQueue", static: false, private: false, access: { has: obj => "addQueue" in obj, get: obj => obj.addQueue }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _processPlaylist_decorators, { kind: "method", name: "processPlaylist", static: false, private: false, access: { has: obj => "processPlaylist" in obj, get: obj => obj.processPlaylist }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _disableMixPlaylist_decorators, { kind: "method", name: "disableMixPlaylist", static: false, private: false, access: { has: obj => "disableMixPlaylist" in obj, get: obj => obj.disableMixPlaylist }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.QueueManager = QueueManager;
//# sourceMappingURL=queueManager.js.map