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
exports.CustomStream = void 0;
const tslib_1 = require("tslib");
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const audiosource_1 = require("./audiosource");
const Commands_1 = require("../Commands");
const Util_1 = require("../Util");
const definition_1 = require("../definition");
class CustomStream extends audiosource_1.AudioSource {
    constructor() {
        super({ isCacheable: false });
    }
    async init(url, prefetched) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        if (prefetched) {
            this.title = prefetched.title || t("audioSources.customStream");
            this.url = url;
            this.lengthSeconds = prefetched.length;
        }
        else if ((0, Util_1.getResourceTypeFromUrl)(url) !== "none") {
            this.url = url;
            const info = await (0, Util_1.retrieveRemoteAudioInfo)(url);
            this.title = info.displayTitle || this.extractFilename() || t("audioSources.customStream");
            this.lengthSeconds = info.lengthSeconds || 0;
        }
        else {
            throw new Error(t("audioSources.invalidStream"));
        }
        this.isPrivateSource = this.url.startsWith("https://cdn.discordapp.com/ephemeral-attachments/");
        return this;
    }
    async fetch() {
        const canBeWithVideo = (0, Util_1.getResourceTypeFromUrl)(this.url) === "video";
        if (!canBeWithVideo) {
            const { statusCode, headers } = await candyget_1.default.head(this.url, {
                headers: {
                    "User-Agent": definition_1.DefaultUserAgent,
                },
            });
            if (200 <= statusCode && statusCode < 300 && headers["content-length"] && headers["accept-ranges"]?.includes("bytes")) {
                return {
                    type: "readable",
                    stream: (0, Util_1.createFragmentalDownloadStream)(this.url, {
                        chunkSize: 1 * 1024 * 1024,
                        contentLength: Number(headers["content-length"]),
                        userAgent: definition_1.DefaultUserAgent,
                    }),
                    streamType: "unknown",
                };
            }
        }
        return {
            type: "url",
            url: this.url,
            streamType: "unknown",
            canBeWithVideo,
        };
    }
    toField(_) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        return [
            {
                name: ":link:URL",
                value: this.url,
            },
            {
                name: `:asterisk:${t("moreInfo")}`,
                value: t("audioSources.customStream"),
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
            title: this.title,
        };
    }
    extractFilename() {
        const url = new URL(this.url);
        return url.pathname.split("/").at(-1);
    }
}
exports.CustomStream = CustomStream;
//# sourceMappingURL=custom.js.map