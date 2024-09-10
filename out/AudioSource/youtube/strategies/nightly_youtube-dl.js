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
exports.NightlyYoutubeDl = void 0;
const baseYoutubeDlStrategy_1 = require("./baseYoutubeDlStrategy");
const binaryManager_1 = require("../../../Component/binaryManager");
const ytDlNightlyBinaryManager = new binaryManager_1.BinaryManager({
    binaryName: "youtube-dl",
    localBinaryName: "ydn_youtube-dl",
    binaryRepo: "ytdl-org/ytdl-nightly",
    checkImmediately: false,
});
const nightlyYoutubeDl = "ytDlNightlyYoutubeDl";
class NightlyYoutubeDl extends baseYoutubeDlStrategy_1.baseYoutubeDlStrategy {
    constructor(priority) {
        super(priority, nightlyYoutubeDl, ytDlNightlyBinaryManager);
    }
    cacheIsValid(cache) {
        return cache?.type === NightlyYoutubeDl;
    }
}
exports.NightlyYoutubeDl = NightlyYoutubeDl;
exports.default = NightlyYoutubeDl;
//# sourceMappingURL=nightly_youtube-dl.js.map