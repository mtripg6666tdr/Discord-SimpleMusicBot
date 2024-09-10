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
exports.baseYoutubeDlStrategy = void 0;
const base_1 = require("./base");
const Util_1 = require("../../../Util");
class baseYoutubeDlStrategy extends base_1.Strategy {
    constructor(priority, id, binaryManager) {
        super(priority);
        this.id = id;
        this.binaryManager = binaryManager;
        this.last = 0;
    }
    get cacheType() {
        return this.id;
    }
    async getInfo(url) {
        this.logStrategyUsed();
        const info = JSON.parse(await this.binaryManager.exec(["--skip-download", "--print-json", url]));
        return {
            data: this.mapToExportable(url, info),
            cache: {
                type: this.id,
                data: info,
            },
        };
    }
    async fetch(url, forceUrl = false, cache) {
        this.logStrategyUsed();
        const availableCache = this.cacheIsValid(cache) && cache.data;
        this.logger.info(availableCache ? "using cache without obtaining" : "obtaining info");
        const info = availableCache || JSON.parse(await this.binaryManager.exec(["--skip-download", "--print-json", url]));
        const partialResult = {
            info: this.mapToExportable(url, info),
            relatedVideos: null,
        };
        if (info.is_live) {
            const format = info.formats.filter(f => f.format_id === info.format_id);
            return {
                ...partialResult,
                stream: {
                    type: "url",
                    url: format[0].url,
                    userAgent: format[0].http_headers["User-Agent"],
                },
                cache: {
                    type: this.id,
                    data: info,
                },
            };
        }
        else {
            const formats = info.formats.filter(f => f.format_note === "tiny" || f.video_ext === "none" && f.abr);
            if (formats.length === 0)
                throw new Error("no format found!");
            const [format] = formats.sort((fa, fb) => fb.abr - fa.abr);
            if (forceUrl) {
                return {
                    ...partialResult,
                    stream: {
                        type: "url",
                        url: format.url,
                        streamType: format.ext === "webm" && format.acodec === "opus"
                            ? "webm/opus"
                            : format.ext === "ogg" && format.acodec === "opus"
                                ? "ogg/opus"
                                : "unknown",
                        userAgent: format.http_headers["User-Agent"],
                    },
                    cache: {
                        type: this.id,
                        data: info,
                    },
                };
            }
            return {
                ...partialResult,
                stream: {
                    type: "readable",
                    stream: (0, Util_1.createFragmentalDownloadStream)(format.url, {
                        contentLength: format.filesize,
                        userAgent: format.http_headers["User-Agent"],
                    }),
                    streamType: format.ext === "webm" && format.acodec === "opus"
                        ? "webm/opus"
                        : format.ext === "ogg" && format.acodec === "opus"
                            ? "ogg/opus"
                            : "unknown",
                },
                cache: {
                    type: this.id,
                    data: info,
                },
            };
        }
    }
    mapToExportable(url, info) {
        return {
            url: url,
            title: info.title,
            description: info.description,
            length: Number(info.duration),
            channel: info.channel,
            channelUrl: info.channel_url,
            thumbnail: info.thumbnail,
            isLive: !!info.is_live,
        };
    }
}
exports.baseYoutubeDlStrategy = baseYoutubeDlStrategy;
var Acodec;
(function (Acodec) {
    Acodec["Mp4A402"] = "mp4a.40.2";
    Acodec["None"] = "none";
    Acodec["Opus"] = "opus";
})(Acodec || (Acodec = {}));
var TempEXT;
(function (TempEXT) {
    TempEXT["M4A"] = "m4a";
    TempEXT["Mp4"] = "mp4";
    TempEXT["Webm"] = "webm";
    TempEXT["Ogg"] = "ogg";
})(TempEXT || (TempEXT = {}));
var Container;
(function (Container) {
    Container["M4ADash"] = "m4a_dash";
    Container["Mp4Dash"] = "mp4_dash";
    Container["WebmDash"] = "webm_dash";
})(Container || (Container = {}));
var Accept;
(function (Accept) {
    Accept["TextHTMLApplicationXHTMLXMLApplicationXMLQ09Q08"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
})(Accept || (Accept = {}));
var AcceptCharset;
(function (AcceptCharset) {
    AcceptCharset["ISO88591UTF8Q07Q07"] = "ISO-8859-1,utf-8;q=0.7,*;q=0.7";
})(AcceptCharset || (AcceptCharset = {}));
var AcceptEncoding;
(function (AcceptEncoding) {
    AcceptEncoding["GzipDeflate"] = "gzip, deflate";
})(AcceptEncoding || (AcceptEncoding = {}));
var AcceptLanguage;
(function (AcceptLanguage) {
    AcceptLanguage["EnUsEnQ05"] = "en-us,en;q=0.5";
})(AcceptLanguage || (AcceptLanguage = {}));
var Protocol;
(function (Protocol) {
    Protocol["HTTPS"] = "https";
})(Protocol || (Protocol = {}));
//# sourceMappingURL=baseYoutubeDlStrategy.js.map