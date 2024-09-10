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
exports.onReady = onReady;
const tslib_1 = require("tslib");
const i18next_1 = tslib_1.__importDefault(require("i18next"));
const discord = tslib_1.__importStar(require("oceanic.js"));
const commandManager_1 = require("../Component/commandManager");
const config_1 = require("../config");
const config = (0, config_1.getConfig)();
async function onReady() {
    const client = this._client;
    this.logger.info("Socket connection is ready now");
    if (this["_isReadyFinished"]) {
        return;
    }
    this["_mentionText"] = `<@${client.user.id}>`;
    this.logger.info("Starting environment checking and preparation.");
    // Set activity as booting
    if (!this.maintenance) {
        client.editStatus("dnd", [
            {
                type: discord.ActivityTypes.GAME,
                name: i18next_1.default.t("startingUp"),
            },
        ]).catch(this.logger.error);
    }
    else {
        client.editStatus("dnd", [
            {
                type: discord.ActivityTypes.GAME,
                name: i18next_1.default.t("maintenance"),
            },
        ]).catch(this.logger.error);
    }
    // Command instance preparing
    await commandManager_1.CommandManager.instance.sync(this.client);
    // add bgm tracks
    if (config.bgm) {
        const guildIds = Object.keys(config.bgm);
        for (let i = 0; i < guildIds.length; i++) {
            if (!this.client.guilds.get(guildIds[i]))
                continue;
            await this
                .initDataWithBgm(guildIds[i], "0", config.bgm[guildIds[i]])
                .initBgmTracks();
        }
    }
    // Recover queues
    if (this.backupper) {
        const joinedGuildIds = [...client.guilds.values()].map(guild => guild.id);
        const guildQueues = await this.backupper.getQueueDataFromBackup(joinedGuildIds);
        const guildStatuses = await this.backupper.getStatusFromBackup(joinedGuildIds);
        if (guildQueues && guildStatuses) {
            const guildQueueIds = [...guildQueues.keys()];
            const guildStatusIds = [...guildStatuses.keys()];
            for (let i = 0; i < guildQueueIds.length; i++) {
                const id = guildQueueIds[i];
                if (guildStatusIds.includes(id)) {
                    try {
                        const server = this.upsertData(id, guildStatuses.get(id).boundChannelId);
                        await server.importQueue(guildQueues.get(id));
                        server.importStatus(guildStatuses.get(id));
                    }
                    catch (e) {
                        this.logger.warn(e);
                    }
                }
            }
            this.logger.info("Finish recovery of queues and statuses.");
        }
    }
    else {
        this.logger.warn("Unable to recover queues and statuses.");
    }
    // Set main tick
    setTimeout(() => {
        this.maintenanceTick();
        setInterval(this.maintenanceTick.bind(this), 1 * 60 * 1000).unref();
    }, 10 * 1000).unref();
    this.logger.info("Interval jobs set up successfully");
    this.emit("beforeReady");
    // Finish initializing
    this["_isReadyFinished"] = true;
    this.emit("ready");
    this.logger.info("Bot is ready now");
    // Set activity
    if (!this.maintenance) {
        client.editStatus("online", [
            {
                type: discord.ActivityTypes.LISTENING,
                name: i18next_1.default.t("music"),
            },
        ]).catch(this.logger.error);
    }
}
//# sourceMappingURL=ready.js.map