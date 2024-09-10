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
exports.SoundCloudS = void 0;
const tslib_1 = require("tslib");
const soundcloud_ts_1 = tslib_1.__importDefault(require("soundcloud.ts"));
const audiosource_1 = require("./audiosource");
const Commands_1 = require("../Commands");
const Util_1 = require("../Util");
let soundCloudClient = new soundcloud_ts_1.default();
class SoundCloudS extends audiosource_1.AudioSource {
    constructor() {
        super({ isSeekable: false });
    }
    async init(url, prefetched) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        this.url = url;
        if (prefetched) {
            this.title = prefetched.title;
            this.description = prefetched.description;
            this.lengthSeconds = prefetched.length;
            this.author = prefetched.author;
            this.thumbnail = prefetched.thumbnail;
        }
        else {
            const info = await soundCloudClient.tracks.getV2(url);
            this.title = info.title;
            this.description = info.description || t("unknown");
            this.lengthSeconds = Math.floor(info.duration / 1000);
            this.author = info.user.username;
            this.thumbnail = info.artwork_url;
        }
        return this;
    }
    async fetch() {
        const source = await soundCloudClient.util.streamTrack(this.url);
        const stream = (0, Util_1.createPassThrough)();
        source
            .on("error", e => !stream.destroyed ? stream.destroy(e) : stream.emit("error", e))
            .pipe(stream)
            .on("close", () => !source.destroyed && source.destroy?.());
        return {
            type: "readable",
            stream,
            streamType: "mp3",
        };
    }
    toField(verbose) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        return [
            {
                name: `:musical_note:${t("user")}`,
                value: this.author,
                inline: false,
            },
            {
                name: `:asterisk:${t("summary")}`,
                value: this.description.length > (verbose ? 1000 : 350) ? this.description.substring(0, verbose ? 1000 : 300) + "..." : this.description,
                inline: false,
            },
        ];
    }
    npAdditional() {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        return `${t("audioSources.artist")}: \`${this.author}\``;
    }
    exportData() {
        return {
            url: this.url,
            title: this.title,
            description: this.description,
            length: this.lengthSeconds,
            author: this.author,
            thumbnail: this.thumbnail,
        };
    }
    purgeCache() {
        soundCloudClient = new soundcloud_ts_1.default();
    }
    static validateUrl(url) {
        return Boolean(url.match(/https?:\/\/soundcloud.com\/.+\/.+/));
    }
    static validatePlaylistUrl(url) {
        return Boolean(url.match(/https?:\/\/soundcloud.com\/[^/?]+\/sets\/[^/?]+/));
    }
}
exports.SoundCloudS = SoundCloudS;
//# sourceMappingURL=soundcloud.js.map