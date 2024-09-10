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
exports.StreamableApi = exports.Streamable = void 0;
const tslib_1 = require("tslib");
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const audiosource_1 = require("./audiosource");
const Commands_1 = require("../Commands");
class Streamable extends audiosource_1.AudioSource {
    constructor() {
        super(...arguments);
        this.streamUrl = "";
    }
    async init(url, prefetched) {
        this.url = url;
        const id = StreamableApi.getVideoId(url);
        if (!id)
            throw new Error("Invalid streamable url");
        if (prefetched) {
            this.lengthSeconds = prefetched.length;
            this.thumbnail = prefetched.thumbnail;
            this.title = prefetched.title;
            this.streamUrl = prefetched.streamUrl;
        }
        else {
            const streamInfo = await StreamableApi.getVideoDetails(id);
            this.lengthSeconds = Math.floor(streamInfo.files["mp4-mobile"].duration);
            this.thumbnail = "https:" + streamInfo.thumbnail_url;
            this.title = streamInfo.title;
            const streamUrl = streamInfo.files["mp4-mobile"].url;
            if (!streamUrl) {
                throw new Error("Invalid streamable url.");
            }
            this.streamUrl = streamUrl;
        }
        return this;
    }
    async fetch() {
        return {
            type: "url",
            streamType: "mp4",
            url: this.streamUrl,
        };
    }
    toField() {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        return [
            {
                name: ":link:URL",
                value: this.url,
            }, {
                name: `:asterisk:${t("moreInfo")}`,
                value: t("audioSources.fileInStramable"),
            },
        ];
    }
    npAdditional() {
        return "";
    }
    exportData() {
        return {
            url: this.url,
            length: this.lengthSeconds,
            thumbnail: this.thumbnail,
            title: this.title,
            streamUrl: this.streamUrl,
        };
    }
}
exports.Streamable = Streamable;
/**
 * Streamable (https://streamable.com)のAPIラッパ
 */
class StreamableApi {
    /**
     * 動画のURLから動画のIDを返します。動画のURL出ない場合にはnullが返されます。存在チェックは行っていません。
     * @param url 動画のURL
     * @returns 動画のID
     */
    static getVideoId(url) {
        const match = url.match(/^https?:\/\/streamable.com\/(?<Id>.+)$/);
        if (match) {
            return match.groups?.Id || null;
        }
        else {
            return null;
        }
    }
    static async getVideoDetails(id) {
        return candyget_1.default.json(`https://api.streamable.com/videos/${id}`).then(({ body }) => body);
    }
}
exports.StreamableApi = StreamableApi;
//# sourceMappingURL=streamable.js.map