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
exports.distubeYtdlCoreStrategy = exports.distubeYtdlCore = void 0;
const tslib_1 = require("tslib");
const ytdl = tslib_1.__importStar(require("@distube/ytdl-core"));
const safe_traverse_1 = require("safe-traverse");
const base_1 = require("./base");
const config_1 = require("../../../config");
const definition_1 = require("../../../definition");
const stream_1 = require("../stream");
exports.distubeYtdlCore = "distubeYtdlCore";
const config = (0, config_1.getConfig)();
const poTokenExperiments = ["51217476", "51217102"];
class distubeYtdlCoreStrategy extends base_1.Strategy {
    constructor() {
        super(...arguments);
        this.agent = config.proxy ? ytdl.createProxyAgent({ uri: config.proxy }) : undefined;
    }
    get cacheType() {
        return exports.distubeYtdlCore;
    }
    async getInfo(url) {
        this.logStrategyUsed();
        const info = await ytdl.getInfo(url, {
            lang: "ja",
            agent: this.agent,
        });
        const nop = this.validateInfoExperiments(info);
        if (!nop) {
            throw new Error("Detected broken formats.");
        }
        return {
            data: this.mapToExportable(url, info),
            cache: {
                type: exports.distubeYtdlCore,
                data: info,
            },
        };
    }
    async fetch(url, forceUrl = false, cache) {
        this.logStrategyUsed();
        const availableCache = this.cacheIsValid(cache) && this.validateCacheExperiments(cache) && cache.data;
        this.logger.info(availableCache ? "using cache without obtaining" : "obtaining info");
        let info = null;
        for (let i = 0; i < 3; i++) {
            info = availableCache || await ytdl.getInfo(url, {
                lang: config.defaultLanguage,
            });
            if (this.validateInfoExperiments(info))
                break;
            (0, safe_traverse_1.safeTraverse)(ytdl)
                .get("cache")
                .values()
                .call("clear", (s) => s.clear());
        }
        if (!this.validateInfoExperiments(info)) {
            throw new Error("Detected broken formats.");
        }
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
                cache: null,
            };
        }
        else {
            const readable = info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow
                ? (0, stream_1.createRefreshableYTLiveStream)(info, url, { format, lang: config.defaultLanguage })
                : (0, stream_1.createChunkedDistubeYTStream)(info, format, { lang: config.defaultLanguage });
            return {
                ...partialResult,
                stream: {
                    type: "readable",
                    stream: readable,
                    streamType: format.container === "webm" && format.audioCodec === "opus"
                        ? "webm/opus"
                        : "unknown",
                },
                cache: null,
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
        return cache?.type === exports.distubeYtdlCore;
    }
    extractExperiments(info) {
        // ref: https://github.com/yt-dlp/yt-dlp/pull/10456/files
        const experiments = (0, safe_traverse_1.safeTraverse)(info)
            .expect(_ => _.response.responseContext.serviceTrackingParams)
            .validate(_ => !!_.find)
            .select(_ => _.find((d) => d.service === "GFEEDBACK"))
            .get("params")
            .validate(_ => !!_.find)
            .select(_ => _.find((d) => d.key === "e"))
            .safeExpect(_ => _.value.split(","))
            .get();
        return experiments || [];
    }
    validateInfoExperiments(info) {
        const experiments = this.extractExperiments(info);
        this.logger.trace("Experiments", experiments.join(", "));
        return !poTokenExperiments.some(expId => experiments.includes(expId));
    }
    validateCacheExperiments(cache) {
        return this.validateInfoExperiments(cache.data);
    }
}
exports.distubeYtdlCoreStrategy = distubeYtdlCoreStrategy;
exports.default = distubeYtdlCoreStrategy;
//# sourceMappingURL=distube_ytdl-core.js.map