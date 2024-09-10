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
exports.Telemetry = void 0;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const os_1 = tslib_1.__importDefault(require("os"));
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const Structure_1 = require("../Structure");
const Util_1 = require("../Util");
const t12HOURS = 12 * 60;
const endpoint = Buffer.from("aHR0cHM6Ly9kc21iLW1ldHJpY3MudXNhbXlvbi5tb2U=", "base64").toString();
class Telemetry extends Structure_1.LogEmitter {
    get paused() {
        return this._paused;
    }
    constructor(bot) {
        super("Telemetry");
        this.bot = bot;
        this.errors = [];
        this.hash = null;
        this._paused = false;
        this.logger.info("Discord-SimpleMusicBot now collects completely anonymous telemetry data about usage.");
        this.logger.info("This is completely optional and you can opt-out it.");
        this.logger.info("See https://sr.usamyon.moe/dsmb-telemetry for details.");
        this.bot.once("ready", this.onReady.bind(this));
    }
    pause() {
        this._paused = true;
    }
    resume() {
        this._paused = false;
    }
    registerError(err) {
        this.errors.push((0, Util_1.filterContent)((0, Util_1.stringifyObject)(err)));
    }
    onReady() {
        this.send().catch(this.logger.warn);
        this.bot.on("tick", this.onTick.bind(this));
        process.on("uncaughtException", err => {
            this.registerError(err);
        });
    }
    onTick(count) {
        if (count % t12HOURS === 0) {
            this.send().catch(this.logger.warn);
        }
    }
    collect() {
        const error = this.errors;
        this.errors = [];
        return {
            botVersion: this.bot.version,
            nodeVersion: process.versions.node,
            cpu: [...new Set(os_1.default.cpus().map(({ model }) => model))].join("|"),
            mem: os_1.default.totalmem(),
            os: os_1.default.platform(),
            guilds: this.bot.client.guilds.size,
            memCache: -1, /* not implemented */
            persCache: -1, /* not implemented */
            error,
            commands: [], /* not implemented */
        };
    }
    calcHash() {
        if (this.hash) {
            return this.hash;
        }
        const original = `${this.bot.client.user.id}|${this.bot.client.user.username}`;
        const hash = this.hash = crypto_1.default.createHash("sha256")
            .update(original)
            .digest()
            .toString("hex");
        this.logger.debug(`(SECRET) Telemetry hash is "${hash}"`);
        return hash;
    }
    restoreErrorLog(errors) {
        this.errors = [...errors, ...this.errors];
    }
    async send() {
        if (this.paused) {
            this.logger.debug("Telemetry is temporarily disabled.");
            return;
        }
        const url = new URL(endpoint);
        url.pathname = "/collect";
        const data = {
            hash: this.calcHash(),
            ...this.collect(),
        };
        const { statusCode } = await candyget_1.default.post(url.href, "empty", {
            headers: {
                "Content-Type": "application/json",
            },
        }, JSON.stringify(data));
        if (statusCode >= 400) {
            this.restoreErrorLog(data.error);
            this.logger.debug(`Failed to send telemetry data. (status: ${statusCode})`);
        }
        else {
            this.logger.debug(`Successfully sent telemetry data. (status: ${statusCode})`);
        }
    }
}
exports.Telemetry = Telemetry;
//# sourceMappingURL=telemetry.js.map