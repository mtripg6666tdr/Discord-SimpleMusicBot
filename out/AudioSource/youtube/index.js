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
exports.YouTube = void 0;
const tslib_1 = require("tslib");
const ytdl = tslib_1.__importStar(require("ytdl-core"));
const strategies_1 = require("./strategies");
const play_dl_1 = require("./strategies/play-dl");
const ytdl_core_1 = require("./strategies/ytdl-core");
const Commands_1 = require("../../Commands");
const decorators_1 = require("../../Util/decorators");
const definition_1 = require("../../definition");
const audiosource_1 = require("../audiosource");
tslib_1.__exportStar(require("./spawner"), exports);
const cacheTimeout = 5 * 60 * 60 * 1000;
let YouTube = (() => {
    var _a;
    let _classSuper = audiosource_1.AudioSource;
    let _instanceExtraInitializers = [];
    let _init_decorators;
    let _fetch_decorators;
    return _a = class YouTube extends _classSuper {
            constructor() {
                super(...arguments);
                // サービス識別子（固定）
                this.cache = (tslib_1.__runInitializers(this, _instanceExtraInitializers), null);
                this.upcomingTimestamp = null;
                this._relatedVideos = [];
            }
            get strategyId() {
                return this._strategyId;
            }
            set strategyId(value) {
                this._strategyId = value;
            }
            get isLiveStream() {
                return this._isLiveStream;
            }
            set isLiveStream(value) {
                this._isLiveStream = value;
            }
            get relatedVideos() {
                return this._relatedVideos;
            }
            set relatedVideos(value) {
                this._relatedVideos = value;
            }
            get isFallbacked() {
                return this._isFallbacked;
            }
            get cacheIsStale() {
                return !this.cache || this.cache.date + cacheTimeout < Date.now();
            }
            get availableAfter() {
                return this.upcomingTimestamp;
            }
            async init(url, prefetched, forceCache) {
                this.url = url = _a.normalizeUrl(url);
                if (prefetched) {
                    this.importData(prefetched);
                }
                else {
                    await this.refreshInfo({ forceCache });
                }
                return this;
            }
            async refreshInfo(options = {}) {
                const { forceCache, onlyIfNoCache } = Object.assign({ forceCache: false, onlyIfNoCache: false }, options);
                if (onlyIfNoCache && this.cache) {
                    return;
                }
                const { result, resolved, isFallbacked } = await (0, strategies_1.attemptGetInfoForStrategies)(this.url);
                // check if fallbacked
                this.strategyId = resolved;
                this._isFallbacked = isFallbacked;
                // check if the video is upcoming
                if (result.cache?.data) {
                    if ("videoDetails" in result.cache.data
                        && result.cache.data.videoDetails.liveBroadcastDetails
                        && result.cache.data.videoDetails.liveBroadcastDetails.startTimestamp
                        && !result.cache.data.videoDetails.liveBroadcastDetails.isLiveNow
                        && !result.cache.data.videoDetails.liveBroadcastDetails.endTimestamp) {
                        this.upcomingTimestamp = result.cache.data.videoDetails.liveBroadcastDetails.startTimestamp;
                    }
                    else if ("LiveStreamData" in result.cache.data
                        && result.cache.data.LiveStreamData.isLive
                        && result.cache.data.video_details.upcoming
                        && typeof result.cache.data.video_details.upcoming === "object") {
                        this.upcomingTimestamp = result.cache.data.video_details.upcoming.toISOString();
                    }
                    else {
                        this.upcomingTimestamp = null;
                    }
                }
                // store data as cache if requested
                if (forceCache) {
                    this.cache = {
                        data: result.cache,
                        date: Date.now(),
                    };
                }
                // import data to the current instance
                this.importData(result.data);
            }
            async fetch(forceUrl) {
                if (this.cacheIsStale) {
                    this.purgeCache();
                }
                const { result, resolved, isFallbacked } = await (0, strategies_1.attemptFetchForStrategies)(this.url, forceUrl, this.cache?.data);
                this.strategyId = resolved;
                this._isFallbacked = isFallbacked;
                // store related videos
                if (result.relatedVideos) {
                    this.relatedVideos = result.relatedVideos;
                }
                this.importData(result.info);
                if (forceUrl) {
                    this.logger.info("Returning a url instead of stream");
                }
                if (result.cache) {
                    this.cache = {
                        data: result.cache,
                        date: Date.now(),
                    };
                }
                return result.stream;
            }
            async fetchVideo() {
                if (this.cacheIsStale) {
                    await this.refreshInfo({ forceCache: true });
                }
                const distubeYtdlCore = "distubeYtdlCore";
                if (this.cache?.data.type === ytdl_core_1.ytdlCore || this.cache?.data.type === distubeYtdlCore) {
                    const info = this.cache.data.data;
                    const isLive = info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow;
                    const format = ytdl.chooseFormat(info.formats, {
                        quality: isLive ? null : "highestvideo",
                        isHLS: isLive,
                    });
                    const { url } = format;
                    return {
                        url,
                        ua: definition_1.SecondaryUserAgent,
                    };
                }
                else if (this.cache?.data.type === play_dl_1.playDl) {
                    const info = this.cache.data.data;
                    const format = info.format.filter(f => f.mimeType?.startsWith("video")).sort((a, b) => b.bitrate - a.bitrate)[0];
                    const url = format.url || info.LiveStreamData.hlsManifestUrl;
                    if (!url) {
                        throw new Error("No url found.");
                    }
                    return {
                        url,
                        ua: definition_1.SecondaryUserAgent,
                    };
                }
                else {
                    throw new Error("No available data found.");
                }
            }
            getStrategyIndicator() {
                return "\\*".repeat(this.strategyId);
            }
            toField(verbose) {
                const { t } = (0, Commands_1.getCommandExecutionContext)();
                const fields = [];
                fields.push({
                    name: `:cinema:${t("channelName")}`,
                    value: this.channelUrl ? `[${this.channelName}](${this.channelUrl})` : this.channelName,
                    inline: false,
                }, {
                    name: `:asterisk:${t("summary")}`,
                    value: this.description.length > (verbose ? 1000 : 350)
                        ? this.description.substring(0, verbose ? 1000 : 300) + "..."
                        : this.description || `*${t("noSummary")}*`,
                    inline: false,
                });
                return fields;
            }
            npAdditional() {
                const { t } = (0, Commands_1.getCommandExecutionContext)();
                return `${t("channelName")}:\`${this.channelName}\``;
            }
            exportData() {
                return {
                    url: this.url,
                    title: this.title,
                    description: this.description,
                    length: this.lengthSeconds,
                    channel: this.channelName,
                    channelUrl: this.channelUrl,
                    thumbnail: this.thumbnail,
                    isLive: this.isLiveStream,
                };
            }
            importData(exportable) {
                this.title = exportable.title;
                this.description = exportable.description || "";
                this.lengthSeconds = exportable.isLive ? NaN : exportable.length;
                this.channelName = exportable.channel;
                this.channelUrl = exportable.channelUrl;
                this.thumbnail = exportable.thumbnail;
                this.isLiveStream = exportable.isLive;
            }
            purgeCache() {
                this.cache = null;
            }
            waitForLive(signal, tick) {
                if (!this.availableAfter) {
                    throw new Error("This is not a live stream");
                }
                return new Promise(resolve => {
                    let timeout = null;
                    signal.addEventListener("abort", () => {
                        if (timeout) {
                            clearTimeout(timeout);
                            resolve();
                        }
                    }, { once: true });
                    const checkForLive = () => {
                        if (signal.aborted)
                            return;
                        tick();
                        const startTime = this.availableAfter;
                        if (!startTime) {
                            resolve();
                        }
                        const waitTime = Math.max(new Date(startTime).getTime() - Date.now(), 20 * 1000);
                        this.logger.info(`Retrying after ${waitTime}ms`);
                        timeout = setTimeout(async () => {
                            if (signal.aborted)
                                return;
                            tick();
                            this.purgeCache();
                            await this.init(this.url, null, false);
                            checkForLive();
                        }, waitTime).unref();
                    };
                    checkForLive();
                });
            }
            static validateURL(url) {
                return ytdl.validateURL(url) || this.youtubeLiveUrlRegExp.test(url);
            }
            static getVideoID(url) {
                if (this.youtubeLiveUrlRegExp.test(url)) {
                    const id = this.youtubeLiveUrlRegExp.exec(url)?.groups?.id;
                    if (id && ytdl.validateID(id)) {
                        return id;
                    }
                }
                return ytdl.getVideoID(url);
            }
            static normalizeUrl(url) {
                if (this.validateURL(url)) {
                    return `https://www.youtube.com/watch?v=${_a.getVideoID(url)}`;
                }
                throw new Error("Invalid URL provided.");
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _init_decorators = [decorators_1.measureTime];
            _fetch_decorators = [decorators_1.measureTime];
            tslib_1.__esDecorate(_a, null, _init_decorators, { kind: "method", name: "init", static: false, private: false, access: { has: obj => "init" in obj, get: obj => obj.init }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _fetch_decorators, { kind: "method", name: "fetch", static: false, private: false, access: { has: obj => "fetch" in obj, get: obj => obj.fetch }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a.youtubeLiveUrlRegExp = /^https?:\/\/(www\.)?youtube\.com\/live\/(?<id>[a-zA-Z0-9-_]{11})$/,
        _a;
})();
exports.YouTube = YouTube;
//# sourceMappingURL=index.js.map