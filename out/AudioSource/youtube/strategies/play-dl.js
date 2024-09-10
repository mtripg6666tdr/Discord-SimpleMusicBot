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
exports.playDlStrategy = exports.playDl = void 0;
const voice_1 = require("@discordjs/voice");
const play_dl_1 = require("play-dl");
const play_dl_2 = require("play-dl");
const base_1 = require("./base");
exports.playDl = "playDl";
class playDlStrategy extends base_1.Strategy {
    get cacheType() {
        return exports.playDl;
    }
    async getInfo(url) {
        this.logStrategyUsed();
        const info = await (0, play_dl_2.video_info)(url);
        return {
            data: this.mapToExportable(url, info),
            cache: {
                type: exports.playDl,
                data: info,
            },
        };
    }
    async fetch(url, forceUrl = false, cache) {
        this.logStrategyUsed();
        const cacheAvailable = this.cacheIsValid(cache) && cache.data;
        this.logger.info(cacheAvailable ? "using cache without obtaining" : "obtaining info");
        const info = cacheAvailable || await (0, play_dl_2.video_info)(url);
        const partialResult = {
            info: this.mapToExportable(url, info),
            relatedVideos: info.related_videos,
        };
        if (info.LiveStreamData.isLive) {
            return {
                ...partialResult,
                stream: {
                    type: "url",
                    url: info.LiveStreamData.hlsManifestUrl,
                    streamType: "m3u8",
                },
                cache: {
                    type: exports.playDl,
                    data: info,
                },
            };
        }
        else if (forceUrl) {
            const format = info.format.filter(f => f.mimeType?.startsWith("audio"));
            if (format.length === 0) {
                throw new Error("no format found!");
            }
            format.sort((fa, fb) => fb.bitrate - fa.bitrate);
            return {
                ...partialResult,
                stream: {
                    type: "url",
                    url: format[0].url,
                    // @ts-expect-error
                    streamType: format[0]["container"] === "webm" && format[0]["codec"] === "opus" ? "webm/opus" : null,
                },
                cache: {
                    type: exports.playDl,
                    data: info,
                },
            };
        }
        else {
            const stream = await (0, play_dl_1.stream_from_info)(info, { quality: 999, discordPlayerCompatibility: true });
            return {
                ...partialResult,
                stream: {
                    type: "readable",
                    stream: stream.stream,
                    streamType: stream.type === voice_1.StreamType.WebmOpus ? "webm/opus" : null,
                },
                cache: {
                    type: exports.playDl,
                    data: info,
                },
            };
        }
    }
    mapToExportable(url, info) {
        if (info.video_details.upcoming)
            throw new Error("This video is still in upcoming");
        return {
            url,
            title: info.video_details.title,
            description: info.video_details.description || "",
            length: Number(info.video_details.durationInSec),
            channel: info.video_details.channel?.name || "不明",
            channelUrl: info.video_details.channel?.url || "",
            thumbnail: info.video_details.thumbnails[0].url,
            isLive: info.video_details.live,
        };
    }
    cacheIsValid(cache) {
        return cache?.type === exports.playDl;
    }
}
exports.playDlStrategy = playDlStrategy;
exports.default = playDlStrategy;
//# sourceMappingURL=play-dl.js.map