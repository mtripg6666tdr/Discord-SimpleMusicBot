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
exports.NicoNicoS = void 0;
const tslib_1 = require("tslib");
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const html_to_text_1 = require("html-to-text");
const node_html_parser_1 = tslib_1.__importDefault(require("node-html-parser"));
const audiosource_1 = require("./audiosource");
const Commands_1 = require("../Commands");
class NicoNicoS extends audiosource_1.AudioSource {
    constructor() {
        super({ isSeekable: false });
        this.nicoTemp = null;
        this.author = "";
        this.views = 0;
    }
    async init(url, prefetched) {
        this.url = url;
        this.nicoTemp = new NiconicoDL(url);
        if (prefetched) {
            this.title = prefetched.title;
            this.description = (0, html_to_text_1.convert)(prefetched.description);
            this.lengthSeconds = prefetched.length;
            this.author = prefetched.author;
            this.thumbnail = prefetched.thumbnail;
            this.views = prefetched.views;
        }
        else {
            const info = await this.nicoTemp.getInfo();
            this.title = info.data.response.video.title;
            this.description = (0, html_to_text_1.convert)(info.data.response.video.description);
            this.lengthSeconds = info.data.response.video.duration;
            this.author = info.data.response.owner.nickname;
            this.thumbnail = info.data.response.video.thumbnail.url;
            this.views = info.data.response.video.count.view;
        }
        return this;
    }
    async fetch() {
        if (!this.nicoTemp) {
            throw new Error("The audio source is not initialized.");
        }
        const { url, cookie } = await this.nicoTemp.fetch();
        return {
            type: "url",
            streamType: "m3u8",
            url,
            cookie,
        };
    }
    toField(verbose) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        return [
            {
                name: `:cinema: ${t("audioSources.videoAuthor")}`,
                value: this.author,
                inline: false,
            },
            {
                name: `:eyes: ${t("audioSources.playCountLabel")}`,
                value: t("audioSources.playCount", { count: this.views }),
                inline: false,
            },
            {
                name: `:asterisk: ${t("summary")}`,
                value: this.description.length > (verbose ? 1000 : 350)
                    ? this.description.substring(0, verbose ? 1000 : 300) + "..."
                    : this.description,
                inline: false,
            },
        ];
    }
    npAdditional() {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        return `${t("audioSources.videoAuthor")}: ` + this.author;
    }
    exportData() {
        return {
            url: this.url,
            length: this.lengthSeconds,
            title: this.title,
            description: this.description,
            author: this.author,
            thumbnail: this.thumbnail,
            views: this.views,
        };
    }
    static validateUrl(url) {
        return NiconicoDL.isWatchUrl(url);
    }
}
exports.NicoNicoS = NicoNicoS;
const niconicoTempWatchUrlRegex = /https:\/\/www\.nicovideo\.jp\/watch\/(?<id>sm\d+)/;
class NiconicoDL {
    constructor(url) {
        this._info = null;
        if (!NiconicoDL.isWatchUrl(url)) {
            throw new Error("The requested url is invalid.");
        }
        this._videoId = niconicoTempWatchUrlRegex.exec(url).groups["id"];
    }
    static isWatchUrl(url) {
        return niconicoTempWatchUrlRegex.test(url);
    }
    async getInfo() {
        const { statusCode, body } = await candyget_1.default.string(`https://www.nicovideo.jp/watch/${this._videoId}`);
        if (statusCode < 200 || 300 <= statusCode) {
            throw new Error("Failed to fetch audio information.");
        }
        const root = (0, node_html_parser_1.default)(body);
        const content = root.querySelector("meta[name=server-response]")?.getAttribute("content");
        if (!content) {
            throw new Error("Failed to fetch audio information.");
        }
        return this._info = JSON.parse(content);
    }
    async fetch() {
        const info = this._info || await this.getInfo();
        const hlsInfoUrl = `https://nvapi.nicovideo.jp/v1/watch/${this._videoId}/access-rights/hls?actionTrackId=${info.data.response.client.watchTrackId}`;
        const audioDomandId = [...info.data.response.media.domand.audios].sort((a, b) => b.bitRate - a.bitRate)[0]?.id;
        if (!audioDomandId) {
            throw new Error("Failed to detect audio stream.");
        }
        const { statusCode, body, headers } = await candyget_1.default.json(hlsInfoUrl, {
            headers: {
                origin: "https://www.nicovideo.jp",
                referer: "https://www.nicovideo.jp/",
                "X-Access-Right-Key": info.data.response.media.domand.accessRightKey,
                "X-Request-With": "nicovideo",
                "X-Frontend-Id": "6",
                "X-Frontend-Version": "0",
                "X-Niconico-Language": "ja-jp",
            },
            body: {
                outputs: info.data.response.media.domand.videos.filter(({ isAvailable }) => isAvailable).map(({ id }) => [id, audioDomandId]),
            },
        });
        if (statusCode < 200 || 300 <= statusCode) {
            throw new Error("Failed to fetch stream information.");
        }
        return {
            url: body.data.contentUrl,
            cookie: headers["set-cookie"].join("\n"),
        };
    }
}
//# sourceMappingURL=niconico.js.map