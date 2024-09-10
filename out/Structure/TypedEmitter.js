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
/* eslint-disable @typescript-eslint/method-signature-style */
const stream_1 = require("stream");
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class TypedEventEmitter extends stream_1.EventEmitter {
    eitherOnce(events, listener) {
        const handler = () => {
            events.forEach(event => this.off(event, handler));
            listener();
        };
        events.forEach(event => this.once(event, handler));
    }
    eitherOn(events, listener) {
        events.forEach(event => this.on(event, listener));
    }
    eitherOff(events, listener) {
        events.forEach(event => this.off(event, listener));
    }
}
exports.default = TypedEventEmitter;
/* eslint-enable @typescript-eslint/method-signature-style */
//# sourceMappingURL=TypedEmitter.js.map