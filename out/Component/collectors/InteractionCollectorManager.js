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
exports.InteractionCollectorManager = void 0;
const InteractionCollector_1 = require("./InteractionCollector");
const Pagenation_1 = require("./Pagenation");
const Structure_1 = require("../../Structure");
class InteractionCollectorManager extends Structure_1.LogEmitter {
    get customIdLength() {
        return this.collectors.size;
    }
    get collectorLength() {
        return new Set(this.collectors.values()).size;
    }
    constructor() {
        super("InteractionCollectorManager");
        this.collectors = new Map();
    }
    create() {
        const collector = new InteractionCollector_1.InteractionCollector(this);
        return this.setCollectorEvents(collector);
    }
    createPagenation() {
        const collector = new Pagenation_1.Pagenation(this);
        return this.setCollectorEvents(collector);
    }
    setCollectorEvents(collector) {
        this.logger.debug(`(${collector.collectorId}) collector created`);
        collector
            .on("customIdsCreate", customIds => {
            this.logger.debug(`(${collector.collectorId}) customIds registered`);
            customIds.forEach(customId => {
                this.collectors.set(customId, collector);
            });
        })
            .once("destroy", () => {
            const customIds = collector.getCustomIds();
            this.logger.debug(`(${collector.collectorId}) customIds unregistered`);
            customIds.forEach(customId => {
                this.collectors.delete(customId);
            });
            this.logger.debug(`CustomIds count: ${this.collectors.size}`);
        });
        return collector;
    }
    /**
     * インタラクションを受信し、対応するコレクターに処理を渡します。
     * @param interaction インタラクション
     * @returns 対応するコレクターが存在し、処理が渡った場合はtrue、それ以外の場合はfalse
     */
    async onInteractionCreate(interaction) {
        const collector = this.collectors.get(interaction.data.customID);
        if (!collector) {
            return false;
        }
        else {
            this.logger.debug(`passed an interaction successfully: ${interaction.data.customID} => ${collector.collectorId}`);
            await interaction.deferUpdate();
            collector.handleInteraction(interaction);
            return true;
        }
    }
}
exports.InteractionCollectorManager = InteractionCollectorManager;
//# sourceMappingURL=InteractionCollectorManager.js.map