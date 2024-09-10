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
exports.PlayManagerWithBgm = void 0;
const voice_1 = require("@discordjs/voice");
const playManager_1 = require("./playManager");
const GuildDataContainerWithBgm_1 = require("../Structure/GuildDataContainerWithBgm");
class PlayManagerWithBgm extends playManager_1.PlayManager {
    constructor() {
        super(...arguments);
        this._bgm = false;
        this._originalVolume = 100;
    }
    get bgm() {
        return this._bgm;
    }
    set bgm(value) {
        if (value && !this._bgm) {
            this._originalVolume = this.volume;
            this.setVolume(this.server.bgmConfig.volume);
        }
        else if (!value && this._bgm) {
            this.setVolume(this._originalVolume);
        }
        this._bgm = value;
        this.logger.debug(`BGM state changed: ${value ? "active" : "inactive"}`);
    }
    get isPlaying() {
        return super.isPlaying && !this.server.queue.isBGM;
    }
    async play({ bgm, ...options } = {}) {
        if (typeof bgm === "undefined") {
            // if bgm is undefined, set the current state
            bgm = this.bgm;
        }
        if (this.server instanceof GuildDataContainerWithBgm_1.GuildDataContainerWithBgm) {
            if ((this.server.queue.isBGM && !bgm || !this.server.queue.isBgmEmpty && bgm) && this._player?.state.status === voice_1.AudioPlayerStatus.Playing) {
                await this.stop({ wait: true });
            }
            this.server.queue.setToPlayBgm(bgm);
        }
        if (!this.getIsBadCondition(bgm))
            this.bgm = bgm;
        this.logger.debug(`BGM state { player: ${this.bgm}, queue: ${this.server.queue.isBGM} }`);
        return super.play(options);
    }
    getIsBadCondition(bgm = this.bgm) {
        this.logger.debug(`Condition: { connecting: ${this.isConnecting}, playing: ${this.isPlaying}, empty: ${this.server.queue.isEmpty}, bgm: ${bgm}, bgmEmpty: ${this.server.queue.isBgmEmpty} }`);
        // 接続していない
        return !this.isConnecting
            // なにかしら再生中
            || this.isPlaying
            // キューが空
            || (this.server.queue.isEmpty && (!bgm || this.server.queue.isBgmEmpty))
            // 準備中
            || this.preparing;
    }
    getNoticeNeeded() {
        return !!this.server.boundTextChannel && !this.bgm;
    }
    disconnect() {
        const result = super.disconnect();
        this.server.queue.setToPlayBgm(false);
        return result;
    }
    async onStreamFinished() {
        if (this._player?.state.status === voice_1.AudioPlayerStatus.Playing) {
            await (0, voice_1.entersState)(this._player, voice_1.AudioPlayerStatus.Idle, 20e3)
                .catch(() => {
                this.logger.warn("Stream has not ended in time and will force stream into destroying");
                return this.stop({ wait: true });
            });
        }
        // 再生が終わったら
        this._errorCount = 0;
        this._errorUrl = "";
        this._cost = 0;
        if (this.bgm) {
            await this.server.queue.next();
            if (this.server.queue.isBgmEmpty) {
                this.logger.info("Queue empty");
                await this.disconnect();
            }
            else {
                await this.play({ quiet: true, bgm: true });
            }
        }
        else {
            return super.onStreamFinished();
        }
    }
}
exports.PlayManagerWithBgm = PlayManagerWithBgm;
//# sourceMappingURL=playManagerWithBgm.js.map