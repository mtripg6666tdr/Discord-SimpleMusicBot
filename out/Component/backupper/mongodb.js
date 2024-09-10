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
exports.MongoBackupper = void 0;
const tslib_1 = require("tslib");
const _1 = require(".");
const Util_1 = require("../../Util");
const decorators_1 = require("../../Util/decorators");
const commandManager_1 = require("../commandManager");
const MongoClient = (0, Util_1.requireIfAny)("mongodb")?.MongoClient;
let MongoBackupper = (() => {
    var _a;
    let _classSuper = _1.Backupper;
    let _instanceExtraInitializers = [];
    let _backupStatus_decorators;
    let _backupQueue_decorators;
    let _getStatusFromBackup_decorators;
    let _getQueueDataFromBackup_decorators;
    return _a = class MongoBackupper extends _classSuper {
            static get backuppable() {
                return process.env.DB_URL && (process.env.DB_URL.startsWith("mongodb://") || process.env.DB_URL.startsWith("mongodb+srv://"));
            }
            constructor(bot, getData) {
                super(bot, getData);
                this.client = (tslib_1.__runInitializers(this, _instanceExtraInitializers), null);
                this.dbConnectionReady = false;
                this.dbError = null;
                this.collections = null;
                this.logger.info("Initializing Mongo DB backup server adapter...");
                // prepare mongodb client
                this.client = new MongoClient(process.env.DB_URL, {
                    appName: `mtripg6666tdr/Discord-SimpleMusicBot#${this.bot.version || "unknown"} MondoDB backup server adapter`,
                });
                this.client.connect()
                    .then(() => {
                    this.logger.info("Database connection ready");
                    const db = this.client.db(process.env.DB_TOKEN || "discord_music_bot_backup");
                    this.collections = {
                        status: db.collection("Status"),
                        queue: db.collection("Queue"),
                        analytics: db.collection("Analytics"),
                    };
                    this.dbConnectionReady = true;
                })
                    .catch(e => {
                    this.logger.error(e);
                    this.logger.warn("Database connection failed");
                    this.dbError = e;
                });
                // set hook
                this.bot.once("beforeReady", () => {
                    const backupStatusFuncFactory = (0, Util_1.createDebounceFunctionsFactroy)(this.backupStatus.bind(this), 5000);
                    const backupQueueFuncFactory = (0, Util_1.createDebounceFunctionsFactroy)(this.backupQueue.bind(this), 5000);
                    const setContainerEvent = (container) => {
                        container.queue.eitherOn(["change", "changeWithoutCurrent"], backupQueueFuncFactory(container.getGuildId()));
                        container.queue.on("settingsChanged", backupStatusFuncFactory(container.getGuildId()));
                        container.player.on("all", backupStatusFuncFactory(container.getGuildId()));
                        container.preferences.on("updateSettings", backupStatusFuncFactory(container.getGuildId()));
                        container.player.on("reportPlaybackDuration", this.addPlayerAnalyticsEvent.bind(this, container.getGuildId()));
                    };
                    this.data.forEach(setContainerEvent);
                    this.bot.on("guildDataAdded", setContainerEvent);
                    this.bot.on("onBotVoiceChannelJoin", (channel) => backupStatusFuncFactory(channel.guild.id)());
                    this.bot.client.on("guildDelete", ({ id }) => this.deleteGuildData(id));
                    // analytics
                    commandManager_1.CommandManager.instance.commands.forEach(command => command.on("run", args => this.addCommandAnalyticsEvent(command, args)));
                    this.logger.info("Hook was set up successfully");
                });
            }
            async deleteGuildData(guildId) {
                if (this.collections && this.dbConnectionReady) {
                    Promise.allSettled([
                        this.collections.queue.deleteOne({ guildId }),
                        this.collections.status.deleteOne({ guildId }),
                    ]).catch(this.logger.error);
                }
                else {
                    this.logger.warn(`No data was removed (guildId: ${guildId}) due to no connection`);
                }
            }
            async backupStatus(guildId) {
                if (!_a.backuppable || !this.dbConnectionReady)
                    return;
                try {
                    this.logger.info(`Backing up status...(${guildId})`);
                    const status = this.data.get(guildId)?.exportStatus();
                    if (!status)
                        return;
                    await this.collections.status.updateOne({ guildId }, {
                        "$set": {
                            guildId,
                            ...status,
                        },
                    }, {
                        upsert: true,
                    });
                }
                catch (er) {
                    this.logger.error(er);
                    this.logger.info("Something went wrong while backing up status");
                }
            }
            async backupQueue(guildId) {
                if (!_a.backuppable || !this.dbConnectionReady)
                    return;
                try {
                    const queue = this.data.get(guildId)?.exportQueue();
                    if (!queue)
                        return;
                    this.logger.info(`Backing up queue...(${guildId})`);
                    await this.collections.queue.updateOne({ guildId }, {
                        "$set": {
                            guildId,
                            ...queue,
                        },
                    }, {
                        upsert: true,
                    });
                }
                catch (er) {
                    this.logger.error(er);
                    this.logger.warn("Something went wrong while backing up queue");
                }
            }
            async addPlayerAnalyticsEvent(guildId, totalDuration, errorCount) {
                if (!_a.backuppable || !this.dbConnectionReady)
                    return;
                try {
                    await this.collections.analytics.insertOne({
                        type: "playlog",
                        guildId,
                        totalDuration,
                        errorCount,
                        timestamp: Date.now(),
                    });
                }
                catch (er) {
                    this.logger.error(er);
                }
            }
            async addCommandAnalyticsEvent(command, context) {
                if (!_a.backuppable || !this.dbConnectionReady)
                    return;
                try {
                    await this.collections.analytics.updateOne({
                        type: "command",
                        commandName: command.name,
                        guildId: context.server.getGuildId(),
                    }, {
                        $inc: {
                            count: 1,
                        },
                    }, {
                        upsert: true,
                    });
                }
                catch (er) {
                    this.logger.error(er);
                }
            }
            async getStatusFromBackup(guildIds) {
                if (!this.dbConnectionReady && !this.dbError)
                    await (0, Util_1.waitForEnteringState)(() => this.dbConnectionReady || !!this.dbError, Infinity);
                if (this.dbError) {
                    this.logger.warn("Database connecting failed!!");
                    return null;
                }
                try {
                    const dbResult = this.collections.status.find({
                        "$or": guildIds.map(id => ({
                            guildId: id,
                        })),
                    });
                    const result = new Map();
                    for await (const doc of dbResult) {
                        result.set(doc.guildId, doc);
                    }
                    return result;
                }
                catch (er) {
                    this.logger.error(er);
                    this.logger.error("Status restoring failed!");
                    return null;
                }
            }
            async getQueueDataFromBackup(guildids) {
                if (!this.dbConnectionReady && !this.dbError)
                    await (0, Util_1.waitForEnteringState)(() => this.dbConnectionReady || !!this.dbError, Infinity);
                if (this.dbError) {
                    this.logger.warn("Database connecting failed!!");
                    return null;
                }
                try {
                    const dbResult = this.collections.queue.find({
                        "$or": guildids.map(id => ({
                            guildId: id,
                        })),
                    });
                    const result = new Map();
                    for await (const doc of dbResult) {
                        result.set(doc.guildId, doc);
                    }
                    return result;
                }
                catch (er) {
                    this.logger.error(er);
                    this.logger.error("Queue restoring failed!");
                    return null;
                }
            }
            async destroy() {
                await this.client.close();
                this.collections = null;
                this.dbConnectionReady = false;
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
exports.MongoBackupper = MongoBackupper;
//# sourceMappingURL=mongodb.js.map