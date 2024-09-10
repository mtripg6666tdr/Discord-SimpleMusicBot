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
exports.Tag = exports.RewardType = exports.BestdoriApi = exports.BestdoriS = void 0;
const tslib_1 = require("tslib");
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const audiosource_1 = require("./audiosource");
const Commands_1 = require("../Commands");
class BestdoriS extends audiosource_1.AudioSource {
    constructor() {
        super(...arguments);
        this.artist = "";
        this.type = null;
    }
    async init(url, prefetched) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        this.url = url;
        const id = BestdoriApi.instance.getAudioId(url);
        if (!id)
            throw new Error("Invalid streamable url");
        this.id = id;
        const data = (await BestdoriApi.instance.getSongInfo())[this.id];
        this.title = data.musicTitle[0];
        this.type = data.tag;
        this.thumbnail = BestdoriApi.instance.getThumbnailUrl(this.id, data.jacketImage[0]);
        this.artist = (await BestdoriApi.instance.getBandInfo())[data.bandId].bandName[0];
        if (prefetched) {
            this.lengthSeconds = prefetched.length;
            this.lyricist = prefetched.lyricist;
            this.composer = prefetched.composer;
            this.arranger = prefetched.arranger;
        }
        else {
            const detailed = await BestdoriApi.instance.getDetailedSongInfo(this.id);
            this.lengthSeconds = Math.floor(detailed.length);
            this.lyricist = detailed.lyricist[0] || t("unknown");
            this.composer = detailed.composer[0] || t("unknown");
            this.arranger = detailed.arranger[0] || t("unknown");
        }
        this.isPrivateSource = true;
        return this;
    }
    async fetch() {
        const paddedId = this.id.toString().padStart(3, "0");
        return {
            type: "url",
            streamType: "mp3",
            url: `https://bestdori.com/assets/jp/sound/bgm${paddedId}_rip/bgm${paddedId}.mp3`,
        };
    }
    toField(_) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        const typeMap = {
            anime: "カバー",
            normal: "アニメ",
        };
        return [
            {
                name: "バンド名",
                value: this.artist,
                inline: false,
            },
            {
                name: "ジャンル",
                value: typeMap[this.type] || t("unknown"),
            },
            {
                name: "楽曲情報",
                value: "作詞: `" + (this.lyricist ?? "情報なし")
                    + "` \r\n作曲: `" + (this.composer ?? "情報なし")
                    + "` \r\n編曲: `" + (this.arranger ?? "情報なし") + "`",
                inline: false,
            },
        ];
    }
    npAdditional() {
        return `アーティスト:\`${this.artist}\``;
    }
    exportData() {
        return {
            url: this.url,
            length: this.lengthSeconds,
            lyricist: this.lyricist,
            composer: this.composer,
            arranger: this.arranger,
            title: this.title,
        };
    }
}
exports.BestdoriS = BestdoriS;
/**
 * Bestdori ( https://bestdori.com )のAPIラッパ
 */
class BestdoriApi {
    static get instance() {
        return this._instance ??= new BestdoriApi();
    }
    constructor() {
        this.BestdoriAllSongInfoEndPoint = "https://bestdori.com/api/songs/all.5.json";
        this.BestdoriAllBandInfoEndPoint = "https://bestdori.com/api/bands/all.1.json";
        this.allsonginfoCache = null;
        this.allbandinfoCache = null;
    }
    async setupData() {
        const lastDateTime = new Date(new Date().toLocaleString(undefined, { timeZone: "Asia/Tokyo" }));
        lastDateTime.setMinutes(0);
        lastDateTime.setSeconds(0);
        lastDateTime.setMilliseconds(0);
        if (lastDateTime.getHours() > 15) {
            lastDateTime.setHours(15);
        }
        else {
            lastDateTime.setHours(0);
        }
        if (!this.allbandinfoCache || lastDateTime.getTime() - this.allbandinfoCache.lastUpdate > 0) {
            this.allbandinfoCache = {
                cache: await candyget_1.default.json(this.BestdoriAllBandInfoEndPoint).then(({ body }) => body),
                lastUpdate: Date.now(),
            };
        }
        if (!this.allsonginfoCache || lastDateTime.getTime() - this.allsonginfoCache.lastUpdate > 0) {
            this.allsonginfoCache = {
                cache: await candyget_1.default.json(this.BestdoriAllSongInfoEndPoint).then(({ body }) => body),
                lastUpdate: Date.now(),
            };
        }
    }
    async getSongInfo() {
        await this.setupData();
        return this.allsonginfoCache.cache;
    }
    async getBandInfo() {
        await this.setupData();
        return this.allbandinfoCache.cache;
    }
    /**
     * BestdoriのURLからIDを返します。BestdoriのURLでない場合にはnullが返されます。存在チェックは行っていません。
     * @param url BestdoriのURL
     * @returns BestdoriのID
     */
    getAudioId(url) {
        const match = url.match(/^https?:\/\/bestdori\.com\/info\/songs\/(?<Id>\d+)(\/.*)?$/);
        if (match) {
            return Number(match.groups?.Id);
        }
        else {
            return null;
        }
    }
    getAudioPage(id) {
        return `https://bestdori.com/info/songs/${id}`;
    }
    async getDetailedSongInfo(id) {
        const apiUrl = `https://bestdori.com/api/songs/${id.toString()}.json`;
        return candyget_1.default.json(apiUrl).then(({ body }) => body);
    }
    getThumbnailUrl(id, jacketimage) {
        return `https://bestdori.com/assets/jp/musicjacket/musicjacket${Math.ceil(id / 10) * 10}_rip/assets-star-forassetbundle-startapp-musicjacket-musicjacket${Math.ceil(id / 10) * 10}-${jacketimage}-jacket.png`;
    }
}
exports.BestdoriApi = BestdoriApi;
BestdoriApi._instance = null;
var RewardType;
(function (RewardType) {
    RewardType["Coin"] = "coin";
    RewardType["PracticeTicket"] = "practice_ticket";
    RewardType["Star"] = "star";
})(RewardType || (exports.RewardType = RewardType = {}));
var Tag;
(function (Tag) {
    Tag["Easy"] = "easy";
    Tag["Expert"] = "expert";
    Tag["Hard"] = "hard";
    Tag["Normal"] = "normal";
})(Tag || (exports.Tag = Tag = {}));
//# sourceMappingURL=bestdori.js.map