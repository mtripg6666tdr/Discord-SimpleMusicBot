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
exports.LogEmitter = void 0;
const tslib_1 = require("tslib");
const TypedEmitter_1 = tslib_1.__importDefault(require("./TypedEmitter"));
const logger_1 = require("../logger");
class LogEmitter extends TypedEmitter_1.default {
    constructor(tag, id) {
        super();
        this.guildId = null;
        this.logger = (0, logger_1.getLogger)(tag, true);
        if (id) {
            this.setGuildId(id);
        }
    }
    setGuildId(guildId) {
        if (!this.logger) {
            throw new Error("Logger is not defined");
        }
        this.logger.addContext("id", guildId);
        this.guildId = guildId;
    }
    getGuildId() {
        if (!this.guildId) {
            throw new Error("Cannot read guild id before guild id initialized.");
        }
        return this.guildId;
    }
}
exports.LogEmitter = LogEmitter;
//# sourceMappingURL=LogEmitter.js.map