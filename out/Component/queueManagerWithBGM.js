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
exports.QueueManagerWithBgm = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const queueManager_1 = require("./queueManager");
const AudioSource = tslib_1.__importStar(require("../AudioSource"));
class QueueManagerWithBgm extends queueManager_1.QueueManager {
    get isBGM() {
        return this._isBGM;
    }
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(parent) {
        super(parent);
        this._bgmDefault = [];
        this._bgmInitial = [];
        this._isBGM = false;
    }
    moveCurrentTracksToBGM() {
        this._bgmDefault = [...this._default];
        this._bgmInitial = [...this._default];
        this._default = [];
        this.logger.info(`Moved ${this._bgmDefault.length} tracks to bgm queue, and the default queue is now empty`);
    }
    resetBgmTracks() {
        this._bgmDefault = [...this._bgmInitial];
    }
    setToPlayBgm(val = true) {
        this._isBGM = val;
    }
    get bgmLength() {
        return this._bgmDefault.length;
    }
    get isBgmEmpty() {
        return this._bgmDefault.length === 0;
    }
    get(index) {
        return this.isBGM ? this._bgmDefault[index] : super.get(index);
    }
    async addQueueOnly({ url, addedBy, method = "push", sourceType = "unknown", gotData = null, preventCache = false, }) {
        if (!url.startsWith("http://")
            && !url.startsWith("https://")
            && fs.existsSync(path.join(__dirname, global.BUNDLED ? "../" : "../../", url))) {
            const result = {
                basicInfo: await new AudioSource.FsStream().init(url, null),
                additionalInfo: {
                    addedBy: {
                        userId: addedBy && this.getUserIdFromMember(addedBy) || "0",
                        displayName: addedBy?.displayName || "unknown",
                    },
                },
            };
            this._default[method](result);
            if (this.server.preferences.equallyPlayback) {
                this.sortByAddedBy();
            }
            const index = this._default.findIndex(q => q === result);
            return { ...result, index };
        }
        return super.addQueueOnly({ url, addedBy, method, sourceType, gotData, preventCache });
    }
    async next() {
        if (this.isBGM) {
            this.server.player.resetError();
            if (this.server.bgmConfig.enableQueueLoop) {
                this._bgmDefault.push(this._bgmDefault[0]);
            }
            this._bgmDefault.shift();
        }
        else {
            return super.next();
        }
    }
}
exports.QueueManagerWithBgm = QueueManagerWithBgm;
//# sourceMappingURL=queueManagerWithBGM.js.map