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
exports.FsStream = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const audiosource_1 = require("./audiosource");
const Commands_1 = require("../Commands");
const Util_1 = require("../Util");
class FsStream extends audiosource_1.AudioSource {
    constructor() {
        super({ isCacheable: false });
    }
    async init(url, _) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        this.url = url;
        const info = await (0, Util_1.retrieveRemoteAudioInfo)(url);
        this.title = info.displayTitle || t("audioSources.customStream");
        this.lengthSeconds = info.lengthSeconds || 0;
        return this;
    }
    async fetch() {
        return {
            type: "readable",
            stream: fs.createReadStream(path.join(__dirname, global.BUNDLED ? "../" : "../../", this.url)),
            streamType: "unknown",
        };
    }
    toField(_) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        return [
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
}
exports.FsStream = FsStream;
//# sourceMappingURL=fs.js.map