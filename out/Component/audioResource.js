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
exports.FixedAudioResource = void 0;
const tslib_1 = require("tslib");
const voice = tslib_1.__importStar(require("@discordjs/voice"));
const TypedEmitter_1 = tslib_1.__importDefault(require("../Structure/TypedEmitter"));
const logger_1 = require("../logger");
class NullMetaAudioResource extends voice.AudioResource {
}
const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe]);
const TIMEOUT = 20 * 1000;
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class FixedAudioResource extends NullMetaAudioResource {
    get volumeTransformer() {
        return this._volume;
    }
    constructor(...args) {
        super(...args);
        this.error = false;
        this.readLength = 0;
        this.estimatedLengthSeconds = 0;
        this.logger = (0, logger_1.getLogger)("FixedAudioResource");
        this.dataUnreadableAt = -1;
        this.timedout = false;
        this._volume = null;
        this.logger.info("instantiated");
        this.events = new TypedEmitter_1.default({
            captureRejections: false,
        });
        this.playStream
            .on("error", (er) => {
            this.logger.info(`Error: ${er.message || er.toString()}; the more info will be logged after this message.`);
            this.logger.trace(er.stack);
            this.logger.trace("Note: the same stacktrace may be logged multiple times.");
            this.logger.info(`Pushed total ${this.readLength} bytes`);
            this.error = true;
        })
            .on("end", () => {
            this.events.emit("end");
            this.logger.info(`Pushed total ${this.readLength} bytes${this.estimatedLengthSeconds !== 0 ? ` (average ${Math.round(this.readLength / this.estimatedLengthSeconds * 8 / 100) / 10} kbps)` : ""}`);
        });
    }
    get isStreamReadable() {
        const res = this.playStream.readable || !(this.playStream.readableEnded || this.playStream.destroyed || this.error || this.timedout);
        if (!res) {
            this.logger.trace(`Stream seems to be ended / readable=${this.playStream.readable}, readableEnded=${this.playStream.readableEnded}, destroyed=${this.playStream.destroyed}, error=${this.error}, timedout=${this.timedout}`);
        }
        return res;
    }
    get readable() {
        if (this.silenceRemaining === 0)
            return false;
        const real = this.isStreamReadable;
        if (!real) {
            if (this.silenceRemaining === -1) {
                this.logger.trace("Silence padding is enabled.");
                this.silenceRemaining = this.silencePaddingFrames;
            }
            return this.silenceRemaining !== 0;
        }
        return real;
    }
    get ended() {
        return !this.isStreamReadable && this.silenceRemaining === 0;
    }
    read() {
        if (this.silenceRemaining === 0) {
            this.logger.trace("Silence padding frame consumed.");
            return null;
        }
        else if (this.silenceRemaining > 0) {
            this.silenceRemaining--;
            this.logger.trace(`Silence padding frame consumed. Remaining: ${this.silenceRemaining}`);
            return SILENCE_FRAME;
        }
        if (this.playStream.readable) {
            if (this.dataUnreadableAt !== -1) {
                this.logger.trace("Stream is now readable");
                this.dataUnreadableAt = -1;
            }
        }
        else if (this.dataUnreadableAt === -1) {
            this.logger.trace("Stream becomes unreadable");
            this.dataUnreadableAt = Date.now();
            return SILENCE_FRAME;
        }
        else if (this.dataUnreadableAt - Date.now() >= TIMEOUT) {
            this.logger.trace("Stream timed out");
            this.timedout = true;
        }
        else {
            this.logger.trace("Stream is not readable; sending silence frame");
            return SILENCE_FRAME;
        }
        if (this.timedout) {
            return null;
        }
        const packet = this.playStream.read();
        if (packet) {
            this.playbackDuration += 20;
            this.readLength += packet.length || 0;
        }
        else if (this.playStream.readable) {
            this.logger.trace("Stream is readable but no packet received. Sending silence frame.");
            return SILENCE_FRAME;
        }
        return packet;
    }
    static fromAudioResource(resource, estimatedLengthSeconds) {
        const _this = new this(resource.edges, [resource.playStream], null, resource.silencePaddingFrames);
        _this.estimatedLengthSeconds = estimatedLengthSeconds;
        _this._volume = resource.volume || null;
        return _this;
    }
}
exports.FixedAudioResource = FixedAudioResource;
//# sourceMappingURL=audioResource.js.map