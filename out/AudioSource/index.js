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
const tslib_1 = require("tslib");
// main structure
tslib_1.__exportStar(require("./audiosource"), exports);
// resolver
tslib_1.__exportStar(require("./resolver"), exports);
// concrete sources
tslib_1.__exportStar(require("./bestdori"), exports);
tslib_1.__exportStar(require("./custom"), exports);
tslib_1.__exportStar(require("./fs"), exports);
tslib_1.__exportStar(require("./googledrive"), exports);
tslib_1.__exportStar(require("./niconico"), exports);
tslib_1.__exportStar(require("./soundcloud"), exports);
tslib_1.__exportStar(require("./spotify"), exports);
tslib_1.__exportStar(require("./streamable"), exports);
tslib_1.__exportStar(require("./twitter"), exports);
tslib_1.__exportStar(require("./youtube"), exports);
//# sourceMappingURL=index.js.map