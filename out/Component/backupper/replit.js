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
exports.ReplitBackupper = void 0;
const tslib_1 = require("tslib");
const _1 = require(".");
const decorators_1 = require("../../Util/decorators");
const replitDatabaseClient_1 = require("../replitDatabaseClient");
let ReplitBackupper = (() => {
    var _a;
    let _classSuper = _1.IntervalBackupper;
    let _instanceExtraInitializers = [];
    let _backupStatus_decorators;
    let _backupQueue_decorators;
    let _getQueueDataFromBackup_decorators;
    let _getStatusFromBackup_decorators;
    return _a = class ReplitBackupper extends _classSuper {
            static get backuppable() {
                return process.env.DB_URL?.startsWith("replit+http");
            }
            constructor(bot, getData) {
                super(bot, getData, "Replit");
                this.db = (tslib_1.__runInitializers(this, _instanceExtraInitializers), null);
                this.db = new replitDatabaseClient_1.ReplitClient(process.env.DB_URL.substring("replit+".length));
                this.bot.client.on("guildDelete", ({ id }) => {
                    Promise.allSettled([
                        this.db.delete(this.getDbKey("status", id)),
                        this.db.delete(this.getDbKey("queue", id)),
                    ]).catch(this.logger.error);
                });
            }
            async backupStatus() {
                if (!this.db)
                    return;
                // determine which data should be backed up
                const filteredGuildIds = this.getStatusModifiedGuildIds();
                // execute
                for (let i = 0; i < filteredGuildIds.length; i++) {
                    const guildId = filteredGuildIds[i];
                    try {
                        this.logger.info(`Backing up status...(${guildId})`);
                        const currentStatus = this.data.get(guildId)?.exportStatus();
                        if (!currentStatus)
                            continue;
                        await this.db.set(this.getDbKey("status", guildId), currentStatus);
                        this.updateStatusCache(guildId, currentStatus);
                    }
                    catch (er) {
                        this.logger.error(er);
                        this.logger.info("Something went wrong while backing up status");
                    }
                }
            }
            async backupQueue() {
                if (!this.db)
                    return;
                const modifiedGuildIds = this.getQueueModifiedGuildIds();
                for (let i = 0; i < modifiedGuildIds.length; i++) {
                    const guildId = modifiedGuildIds[i];
                    try {
                        this.logger.info(`Backing up queue...(${guildId})`);
                        const queue = this.data.get(guildId)?.exportQueue();
                        if (!queue)
                            continue;
                        await this.db.set(this.getDbKey("queue", guildId), queue);
                        this.unmarkQueueModifiedGuild(guildId);
                    }
                    catch (er) {
                        this.logger.error(er);
                        this.logger.info("Something went wrong while backing up queue");
                    }
                }
            }
            async getQueueDataFromBackup(guildIds) {
                const result = new Map();
                try {
                    await Promise.allSettled(guildIds.map(async (id) => {
                        const queue = await this.db.get(this.getDbKey("queue", id));
                        if (queue) {
                            result.set(id, queue);
                        }
                    }));
                    return result;
                }
                catch (er) {
                    this.logger.error(er);
                    this.logger.error("Queue restoring failed!");
                    return null;
                }
            }
            async getStatusFromBackup(guildIds) {
                const result = new Map();
                try {
                    await Promise.allSettled(guildIds.map(async (id) => {
                        const status = await this.db.get(this.getDbKey("status", id));
                        if (status) {
                            result.set(id, status);
                            this.updateStatusCache(id, status);
                        }
                    }));
                    return result;
                }
                catch (er) {
                    this.logger.error(er);
                    this.logger.error("Status restoring failed!");
                    return null;
                }
            }
            getDbKey(type, guildId) {
                return `dsmb-${type === "status" ? "s" : "q"}-${guildId}`;
            }
            destroy() {
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _backupStatus_decorators = [decorators_1.measureTime];
            _backupQueue_decorators = [decorators_1.measureTime];
            _getQueueDataFromBackup_decorators = [decorators_1.measureTime];
            _getStatusFromBackup_decorators = [decorators_1.measureTime];
            tslib_1.__esDecorate(_a, null, _backupStatus_decorators, { kind: "method", name: "backupStatus", static: false, private: false, access: { has: obj => "backupStatus" in obj, get: obj => obj.backupStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _backupQueue_decorators, { kind: "method", name: "backupQueue", static: false, private: false, access: { has: obj => "backupQueue" in obj, get: obj => obj.backupQueue }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _getQueueDataFromBackup_decorators, { kind: "method", name: "getQueueDataFromBackup", static: false, private: false, access: { has: obj => "getQueueDataFromBackup" in obj, get: obj => obj.getQueueDataFromBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _getStatusFromBackup_decorators, { kind: "method", name: "getStatusFromBackup", static: false, private: false, access: { has: obj => "getStatusFromBackup" in obj, get: obj => obj.getStatusFromBackup }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.ReplitBackupper = ReplitBackupper;
//# sourceMappingURL=replit.js.map