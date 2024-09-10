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
exports.ytdlCoreStrategy = exports.ytdlCore = void 0;
const tslib_1 = require("tslib");
const https_proxy_agent_1 = require("https-proxy-agent");
const ytdl = tslib_1.__importStar(require("ytdl-core"));
const base_1 = require("./base");
const config_1 = require("../../../config");
const definition_1 = require("../../../definition");
const stream_1 = require("../stream");
exports.ytdlCore = "ytdlCore";
const config = (0, config_1.getConfig)();
class ytdlCoreStrategy extends base_1.Strategy {
    constructor() {
        super(...arguments);
        this.agent = config.proxy ? new https_proxy_agent_1.HttpsProxyAgent(config.proxy) : undefined;
    }
    get cacheType() {
        return exports.ytdlCore;
    }
    async getInfo(url) {
        this.logStrategyUsed();
        const requestOptions = this.agent ? { agent: this.agent } : undefined;
        const info = await ytdl.getInfo(url, {
            lang: "ja",
            requestOptions,
        });
        return {
            data: this.mapToExportable(url, info),
            cache: {
                type: exports.ytdlCore,
                data: info,
            },
        };
    }
    async fetch(url, forceUrl = false, cache) {
        this.logStrategyUsed();
        const availableCache = this.cacheIsValid(cache) && cache.data;
        this.logger.info(availableCache ? "using cache without obtaining" : "obtaining info");
        const info = availableCache || await ytdl.getInfo(url, {
            lang: config.defaultLanguage,
        });
        const format = ytdl.chooseFormat(info.formats, info.videoDetails.liveBroadcastDetails?.isLiveNow ? {
            filter: undefined,
            quality: undefined,
            isHLS: false,
        } : {
            filter: "audioonly",
            quality: "highestaudio",
        });
        this.logger.info(`format: ${format.itag}, bitrate: ${format.bitrate}bps, audio codec:${format.audioCodec}, container: ${format.container}`);
        const partialResult = {
            info: this.mapToExportable(url, info),
            relatedVideos: info.related_videos.filter(v => !v.isLive).map(video => ({
                url: `https://www.youtube.com/watch?v=${video.id}`,
                title: video.title,
                description: "No description due to being fetched via related-videos.",
                length: video.length_seconds,
                channel: video.author?.name,
                channelUrl: video.author?.channel_url,
                thumbnail: video.thumbnails[0].url,
                isLive: video.isLive,
            })),
        };
        if (forceUrl) {
            return {
                ...partialResult,
                stream: {
                    type: "url",
                    url: format.url,
                    userAgent: definition_1.SecondaryUserAgent,
                    streamType: format.container === "webm" && format.audioCodec === "opus"
                        ? "webm/opus"
                        : "unknown",
                },
                cache: {
                    type: exports.ytdlCore,
                    data: info,
                },
            };
        }
        else {
            const readable = info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow
                ? (0, stream_1.createRefreshableYTLiveStream)(info, url, { format, lang: config.defaultLanguage })
                : (0, stream_1.createChunkedYTStream)(info, format, { lang: config.defaultLanguage }, 1 * 1024 * 1024);
            return {
                ...partialResult,
                stream: {
                    type: "readable",
                    stream: readable,
                    streamType: format.container === "webm" && format.audioCodec === "opus"
                        ? "webm/opus"
                        : "unknown",
                },
                cache: {
                    type: exports.ytdlCore,
                    data: info,
                },
            };
        }
    }
    mapToExportable(url, info) {
        return {
            url,
            title: info.videoDetails.title,
            description: info.videoDetails.description || "",
            length: Number(info.videoDetails.lengthSeconds),
            channel: info.videoDetails.ownerChannelName,
            channelUrl: info.videoDetails.author.channel_url,
            thumbnail: info.videoDetails.thumbnails[0].url,
            isLive: !!(info.videoDetails.isLiveContent && info.videoDetails.liveBroadcastDetails?.isLiveNow),
        };
    }
    cacheIsValid(cache) {
        return cache?.type === exports.ytdlCore;
    }
}
exports.ytdlCoreStrategy = ytdlCoreStrategy;
exports.default = ytdlCoreStrategy;
//# sourceMappingURL=ytdl-core.js.map