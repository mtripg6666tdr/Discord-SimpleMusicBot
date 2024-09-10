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
exports.getMemoryInfo = getMemoryInfo;
exports.getMBytes = getMBytes;
const tslib_1 = require("tslib");
const os = tslib_1.__importStar(require("os"));
const _1 = require(".");
/**
  * メモリ使用情報を取得します
  * @returns メモリ使用情報
  */
function getMemoryInfo() {
    const free = getMBytes(os.freemem());
    const total = getMBytes(os.totalmem());
    const used = total - free;
    const usage = (0, _1.getPercentage)(used, total);
    return {
        free,
        total,
        used,
        usage,
    };
}
/**
  * 指定されたバイト数をメガバイトに変換します
  * @param bytes 指定されたバイト
  * @returns 返還後のメガバイト数
  */
function getMBytes(bytes) {
    return Math.round(bytes / 1024 /*KB*/ / 1024 /*MB*/ * 100) / 100;
}
//# sourceMappingURL=system.js.map