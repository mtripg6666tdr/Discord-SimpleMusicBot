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
exports.InteractionCollector = void 0;
const tslib_1 = require("tslib");
const crypto = tslib_1.__importStar(require("crypto"));
const Structure_1 = require("../../Structure");
class InteractionCollector extends Structure_1.LogEmitter {
    getCustomIds() {
        return [...this.customIdMap.keys()];
    }
    get collectorId() {
        return this._collectorId;
    }
    constructor(parent) {
        const collectorId = crypto.randomUUID();
        super("InteractionCollector", collectorId);
        this.parent = parent;
        // <customId, componentId>
        this.customIdMap = new Map();
        this.receivedCount = 0;
        this.maxReceiveCount = 1;
        this.userId = null;
        this.timer = null;
        this.timeout = null;
        this.destroyed = false;
        this.resetTimeoutOnInteraction = false;
        this.message = null;
        this._collectorId = collectorId;
    }
    setMaxInteraction(count) {
        this.maxReceiveCount = count;
        this.logger.debug(`max interaction count: ${count}`);
        return this;
    }
    setTimeout(timeout) {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.logger.debug(`timeout: ${timeout}`);
        this.timer = setTimeout(() => {
            this.destroy();
            this.emit("timeout");
        }, timeout).unref();
        this.timeout = timeout;
        return this;
    }
    setAuthorIdFilter(userId = null) {
        this.userId = userId;
        this.logger.debug(`author filter: ${this.userId}`);
        return this;
    }
    setResetTimeoutOnInteraction(reset) {
        this.resetTimeoutOnInteraction = reset;
        return this;
    }
    createCustomIds(componentTypes) {
        const existingComponentIds = [...this.customIdMap.values()];
        const componentIds = Object.keys(componentTypes);
        if (componentIds.some(id => existingComponentIds.includes(id))) {
            throw new Error("Duplicated key");
        }
        const customIds = Array.from({ length: componentIds.length }, () => `collector-${crypto.randomUUID()}`);
        const componentIdCustomIdMap = {};
        customIds.forEach((customId, i) => {
            this.customIdMap.set(customId, componentIds[i]);
            componentIdCustomIdMap[componentIds[i]] = customId;
        });
        this.emit("customIdsCreate", customIds);
        this.logger.debug("customId created", componentIdCustomIdMap);
        return {
            customIdMap: componentIdCustomIdMap,
            collector: this,
        };
    }
    handleInteraction(interaction) {
        const componentId = this.customIdMap.get(interaction.data.customID);
        if (!componentId) {
            this.logger.warn(`unknown custom id: ${interaction.data.customID}`);
            return;
        }
        else if (this.userId && interaction.member.id !== this.userId) {
            this.logger.warn(`forbidden interaction; ignoring: ${interaction.data.customID}`);
            return;
        }
        this.logger.debug(`id mapped ${interaction.data.customID} => ${componentId}`);
        if (this.resetTimeoutOnInteraction && this.timeout) {
            this.setTimeout(this.timeout);
        }
        this.emit(componentId, interaction);
        this.receivedCount++;
        if (this.receivedCount >= this.maxReceiveCount) {
            this.destroy();
        }
    }
    setMessage(message) {
        this.message = message;
        return message;
    }
    destroy() {
        if (!this.destroyed) {
            this.destroyed = true;
            this.emit("destroy");
            this.logger.debug("destroyed");
        }
        if (this.message) {
            this.message.edit({
                components: [],
            }).catch(this.logger.error);
            this.message = null;
        }
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
exports.InteractionCollector = InteractionCollector;
//# sourceMappingURL=InteractionCollector.js.map