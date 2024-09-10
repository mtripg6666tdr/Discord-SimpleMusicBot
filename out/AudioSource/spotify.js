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
exports.Spotify = void 0;
const tslib_1 = require("tslib");
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const spotify_url_info_1 = tslib_1.__importDefault(require("spotify-url-info"));
const audiosource_1 = require("./audiosource");
const spawner_1 = require("./youtube/spawner");
const strategies_1 = require("./youtube/strategies");
const Util_1 = require("../Util");
const definition_1 = require("../definition");
const client = (0, spotify_url_info_1.default)((url, opts) => (0, candyget_1.default)(url, "string", opts).then(res => ({ text: () => res.body })));
class Spotify extends audiosource_1.AudioSource {
    constructor() {
        super({ isCacheable: false });
        this.artist = "";
        this.referenceUrl = null;
    }
    async init(url, prefetched) {
        if (!Spotify.validateTrackUrl(url))
            throw new Error("Invalid url");
        if (prefetched) {
            this.url = prefetched.url;
            this.lengthSeconds = prefetched.length;
            this.title = prefetched.title;
            this.artist = prefetched.artist;
            this.referenceUrl = prefetched.referenceUrl;
            this.thumbnail = prefetched.thumbnail || this.thumbnail;
        }
        else {
            this.url = url = Spotify.formatUrl(url);
            const track = await client.getData(url);
            this.lengthSeconds = Math.floor(track.duration / 1000);
            this.title = track.name;
            this.artist = track.artists.map(artist => artist.name).join(", ");
            this.thumbnail = track.coverArt.sources[0]?.url || definition_1.DefaultAudioThumbnailURL;
        }
        return this;
    }
    async fetch(forceUrl) {
        if (!this.referenceUrl) {
            // construct search keyword
            // eslint-disable-next-line newline-per-chained-call
            const keyword = `${this.title} ${this.artist.split(",").map(artist => artist.trim()).join(" ")}`;
            // search youtube
            this.logger.debug(`Searching the keyword: ${`${this.title} ${this.artist.split(",").map(artist => artist.trim())}`}`);
            const searchResult = await (0, spawner_1.searchYouTube)(keyword);
            // extract videos that seem to be ok
            this.logger.debug("Extracting the valid item...");
            const items = searchResult.items
                .filter(({ type }) => type === "video");
            const target = this.extractBestItem(items);
            if (!target)
                throw new Error("Not Found");
            // store the result
            this.referenceUrl = target.url;
        }
        (0, Util_1.assertIsNotNull)(this.referenceUrl);
        // fetch the video
        const { result } = await (0, strategies_1.attemptFetchForStrategies)(this.referenceUrl, forceUrl);
        this.title = result.info.title;
        this.lengthSeconds = result.info.length;
        this.thumbnail = result.info.thumbnail;
        return result.stream;
    }
    extractBestItem(items) {
        this.logger.debug("result", items);
        const normalize = (text) => {
            return text.toLowerCase()
                .replace(/’/g, "'")
                .replace(/\(.+?\)/g, "")
                .replace(/（.+?）/g, "")
                .replace(/【.+?】/g, "")
                // eslint-disable-next-line no-irregular-whitespace
                .replace(/　/g, " ")
                .replace(/-/g, "")
                .trim();
        };
        const includes = (text1, text2) => {
            text1 = normalize(text1);
            return normalize(text2)
                .split(" ")
                .every(p => text1.includes(p));
        };
        const validate = (item) => {
            return (
            // 関連のないタイトルを除外
            includes(item.title, this.title.replace(/feat\.\s?.+?(\s|$)/, "").toLowerCase())
                || includes(this.title.replace(/feat\.\s?.+?(\s|$)/, "").toLowerCase(), item.title.toLowerCase()))
                // カバー曲を除外
                && !includes(item.title.toLowerCase(), "cover")
                && !includes(item.title, "カバー")
                && !includes(item.title, "歌ってみた")
                && !includes(item.title, "弾いてみた")
                && !includes(item.title.toLowerCase(), "#shorts")
                && (this.title.toLowerCase().includes("remix") || !includes(item.title.toLowerCase(), "remix"));
        };
        const validItems = items
            .map(item => {
            if ("name" in item) {
                item.title = item.name;
            }
            return item;
        })
            .filter(validate);
        this.logger.debug("valid", validItems);
        if (validItems.length === 0)
            return items[0];
        // official channel
        let filtered = validItems.filter(item => (item.author && item.author.ownerBadges.length > 0)
            || item.author?.verified
            || item.author?.name.endsWith("Topic")
            || item.author?.name.endsWith("トピック"));
        this.logger.debug("official ch", filtered);
        if (filtered[0])
            return filtered[0];
        // official item
        filtered = validItems.filter(item => includes(item.title, "official") || includes(item.title, "公式"));
        this.logger.debug("official item", filtered);
        if (filtered[0])
            return filtered[0];
        // pv /mv
        filtered = validItems.filter(item => includes(item.title, "pv") || includes(item.title, "mv"));
        this.logger.debug("PV/MV", filtered);
        if (filtered[0])
            return filtered[0];
        // no live
        filtered = validItems.filter(item => !includes(item.title, "live") && !includes(item.title, "ライブ"));
        this.logger.debug("no live", filtered);
        if (filtered[0])
            return filtered[0];
        // other
        if (validItems[0])
            return validItems[0];
        return items[0];
    }
    exportData() {
        return {
            url: this.url,
            title: this.title,
            length: this.lengthSeconds,
            artist: this.artist,
            thumbnail: this.thumbnail,
            referenceUrl: this.referenceUrl,
        };
    }
    npAdditional() {
        return "";
    }
    toField() {
        return [];
    }
    purgeCache() {
        this.referenceUrl = null;
    }
    static validateTrackUrl(url) {
        return this.validateTrackUrlRegExp.test(url);
    }
    static validatePlaylistUrl(url) {
        return this.validatePlaylistUrlRegExp.test(url);
    }
    static formatUrl(url) {
        return url.replace(/intl-[a-z]{2}\//, "");
    }
    static getTrackUrl(uri) {
        return `https://open.spotify.com/track/${uri.replace(/spotify:track:/, "")}`;
    }
    static getPlaylistUrl(uri, type) {
        return `https://open.spotify.com/${type}/${uri.replace(/spotify:(playlist|album):/, "")}`;
    }
    static async expandShortenLink(url) {
        const result = await candyget_1.default.empty(url);
        if (this.validatePlaylistUrl(result.url.href)) {
            return {
                type: "playlist",
                url: result.url.href,
            };
        }
        else if (this.validateTrackUrl(result.url.href)) {
            return {
                type: "track",
                url: result.url.href,
            };
        }
        else {
            return null;
        }
    }
    static get client() {
        return client;
    }
    static get available() {
        return !!client;
    }
}
exports.Spotify = Spotify;
Spotify.validateTrackUrlRegExp = /^https?:\/\/open\.spotify\.com\/(intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]+)(\?.*)?$/;
Spotify.validatePlaylistUrlRegExp = /^https?:\/\/open\.spotify\.com\/(playlist|album)\/([a-zA-Z0-9]+)(\?.*)?$/;
//# sourceMappingURL=spotify.js.map