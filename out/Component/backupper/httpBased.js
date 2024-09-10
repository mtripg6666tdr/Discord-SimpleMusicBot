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
exports.HttpBackupper = void 0;
const tslib_1 = require("tslib");
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const _1 = require(".");
const decorators_1 = require("../../Util/decorators");
const MIME_JSON = "application/json";
let HttpBackupper = (() => {
    var _a;
    let _classSuper = _1.IntervalBackupper;
    let _instanceExtraInitializers = [];
    let _backupStatus_decorators;
    let _backupQueue_decorators;
    let _getStatusFromBackup_decorators;
    let _getQueueDataFromBackup_decorators;
    return _a = class HttpBackupper extends _classSuper {
            constructor(bot, getData) {
                super(bot, getData, "HttpBased");
                this.userAgent = tslib_1.__runInitializers(this, _instanceExtraInitializers);
                this.userAgent = `mtripg6666tdr/Discord-SimpleMusicBot#${this.bot.version || "unknown"} http based backup server adapter`;
            }
            static get backuppable() {
                return !!(process.env.DB_TOKEN && process.env.DB_URL);
            }
            /**
             * 接続ステータス等をバックアップします
             */
            async backupStatus() {
                try {
                    const statusModifiedGuildIds = this.getStatusModifiedGuildIds();
                    if (statusModifiedGuildIds.length <= 0) {
                        this.logger.debug("No modified status found, skipping");
                        return;
                    }
                    this.logger.info("Backing up modified status...");
                    const statuses = {};
                    const originalStatuses = {};
                    statusModifiedGuildIds.forEach(id => {
                        const status = this.data.get(id)?.exportStatus();
                        if (!status)
                            return;
                        statuses[id] = [
                            status.voiceChannelId,
                            status.boundChannelId,
                            status.loopEnabled ? "1" : "0",
                            status.queueLoopEnabled ? "1" : "0",
                            status.addRelatedSongs ? "1" : "0",
                            status.equallyPlayback ? "1" : "0",
                            status.volume,
                            status.disableSkipSession,
                            status.nowPlayingNotificationLevel,
                        ].join(":");
                        originalStatuses[id] = status;
                    });
                    const payload = {
                        token: process.env.DB_TOKEN,
                        type: "j",
                        guildid: statusModifiedGuildIds.join(","),
                        data: JSON.stringify(statuses),
                    };
                    await candyget_1.default.post(process.env.DB_URL, "json", {
                        headers: {
                            "Content-Type": MIME_JSON,
                            "User-Agent": this.userAgent,
                        },
                        validator: this.postResultValidator.bind(this),
                    }, payload);
                    statusModifiedGuildIds.forEach(id => this.updateStatusCache(id, originalStatuses[id]));
                }
                catch (e) {
                    this.logger.warn(e);
                }
            }
            /**
             * キューをバックアップします
             */
            async backupQueue() {
                try {
                    const modifiedGuildIds = this.getQueueModifiedGuildIds();
                    if (modifiedGuildIds.length <= 0) {
                        this.logger.debug("No modified queue found, skipping");
                        return;
                    }
                    this.logger.info("Backing up modified queue...");
                    const queues = {};
                    modifiedGuildIds.forEach(id => {
                        const guild = this.data.get(id);
                        if (!guild)
                            return;
                        queues[id] = encodeURIComponent(JSON.stringify(guild.exportQueue()));
                    });
                    const payload = {
                        token: process.env.DB_TOKEN,
                        guildid: modifiedGuildIds.join(","),
                        data: JSON.stringify(queues),
                        type: "queue",
                    };
                    const { body } = await candyget_1.default.post(process.env.DB_URL, "json", {
                        headers: {
                            "Content-Type": MIME_JSON,
                            "User-Aegnt": this.userAgent,
                        },
                        validator: this.postResultValidator.bind(this),
                    }, payload);
                    if (body.status === 200) {
                        this.unmarkAllQueueModifiedGuild();
                    }
                    else {
                        throw new Error(`Status code: ${body.status}`);
                    }
                }
                catch (e) {
                    this.logger.error(e);
                    this.logger.info("Something went wrong while backing up queue");
                }
            }
            async getStatusFromBackup(guildids) {
                if (_a.backuppable) {
                    try {
                        const { body: result } = await candyget_1.default.json(`${process.env.DB_URL}?token=${encodeURIComponent(process.env.DB_TOKEN)}&guildid=${guildids.join(",")}&type=j`, {
                            headers: {
                                "User-Agent": this.userAgent,
                            },
                            validator: this.getResultValidator.bind(this),
                        });
                        if (result.status === 200) {
                            const frozenGuildStatuses = result.data;
                            const map = new Map();
                            Object.keys(frozenGuildStatuses).forEach(key => {
                                const [voiceChannelId, boundChannelId, loopEnabled, queueLoopEnabled, addRelatedSongs, equallyPlayback, volume, disableSkipSession, nowPlayingNotificationLevel,] = frozenGuildStatuses[key].split(":");
                                const numVolume = Number(volume) || 100;
                                const b = (v) => v === "1";
                                map.set(key, {
                                    voiceChannelId,
                                    boundChannelId,
                                    loopEnabled: b(loopEnabled),
                                    queueLoopEnabled: b(queueLoopEnabled),
                                    addRelatedSongs: b(addRelatedSongs),
                                    equallyPlayback: b(equallyPlayback),
                                    volume: numVolume >= 1 && numVolume <= 200 ? numVolume : 100,
                                    disableSkipSession: b(disableSkipSession),
                                    nowPlayingNotificationLevel: Number(nowPlayingNotificationLevel) || 0,
                                });
                            });
                            return map;
                        }
                        else {
                            return null;
                        }
                    }
                    catch (er) {
                        this.logger.error(er);
                        this.logger.warn("Status restoring failed!");
                        return null;
                    }
                }
                else {
                    return null;
                }
            }
            async getQueueDataFromBackup(guildids) {
                if (_a.backuppable) {
                    try {
                        const { body: result } = await candyget_1.default.json(`${process.env.DB_URL}?token=${encodeURIComponent(process.env.DB_TOKEN)}&guildid=${guildids.join(",")}&type=queue`, {
                            headers: {
                                "User-Agent": this.userAgent,
                            },
                            validator: this.getResultValidator.bind(this),
                        });
                        if (result.status === 200) {
                            const frozenQueues = result.data;
                            const res = new Map();
                            Object.keys(frozenQueues).forEach(key => {
                                try {
                                    const ymx = JSON.parse(decodeURIComponent(frozenQueues[key]));
                                    res.set(key, ymx);
                                }
                                catch { /* empty */ }
                            });
                            return res;
                        }
                        else {
                            return null;
                        }
                    }
                    catch (er) {
                        this.logger.error(er);
                        this.logger.warn("Queue restoring failed!");
                        return null;
                    }
                }
                else {
                    return null;
                }
            }
            postResultValidator(data) {
                return data && typeof data === "object" && typeof data.status === "number";
            }
            getResultValidator(data) {
                return this.postResultValidator(data) && "data" in data && typeof data.data === "object";
            }
            destroy() {
                /* empty */
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _backupStatus_decorators = [decorators_1.measureTime];
            _backupQueue_decorators = [decorators_1.measureTime];
            _getStatusFromBackup_decorators = [decorators_1.measureTime];
            _getQueueDataFromBackup_decorators = [decorators_1.measureTime];
            tslib_1.__esDecorate(_a, null, _backupStatus_decorators, { kind: "method", name: "backupStatus", static: false, private: false, access: { has: obj => "backupStatus" in obj, get: obj => obj.backupStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _backupQueue_decorators, { kind: "method", name: "backupQueue", static: false, private: false, access: { has: obj => "backupQueue" in obj, get: obj => obj.backupQueue }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _getStatusFromBackup_decorators, { kind: "method", name: "getStatusFromBackup", static: false, private: false, access: { has: obj => "getStatusFromBackup" in obj, get: obj => obj.getStatusFromBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _getQueueDataFromBackup_decorators, { kind: "method", name: "getQueueDataFromBackup", static: false, private: false, access: { has: obj => "getQueueDataFromBackup" in obj, get: obj => obj.getQueueDataFromBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.HttpBackupper = HttpBackupper;
//# sourceMappingURL=httpBased.js.map