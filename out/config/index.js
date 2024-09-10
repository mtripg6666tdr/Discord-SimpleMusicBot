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
exports.getConfig = getConfig;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const compiler_1 = require("@sinclair/typebox/compiler");
const value_1 = require("@sinclair/typebox/value");
const comment_json_1 = tslib_1.__importDefault(require("comment-json"));
const schema_1 = require("./schema");
const DEVELOPMENT_PHASE = false;
class ConfigLoader {
    constructor() {
        this.load();
    }
    static get instance() {
        if (this._instance) {
            return this._instance;
        }
        else {
            return this._instance = new this();
        }
    }
    get config() {
        return this._config;
    }
    load() {
        const checker = compiler_1.TypeCompiler.Compile(schema_1.ConfigSchema);
        let config = null;
        try {
            config = comment_json_1.default.parse(fs.readFileSync(path.join(__dirname, global.BUNDLED ? "../config.json" : "../../config.json"), { encoding: "utf-8" }), undefined, true);
        }
        catch (er) {
            throw new Error("Failed to parse `config.json`.", {
                cause: er,
            });
        }
        const errs = [...checker.Errors(config)];
        if (errs.length > 0) {
            throw new Error("Invalid `config.json`.", {
                cause: errs,
            });
        }
        if (DEVELOPMENT_PHASE && (!config || typeof config !== "object" || !("debug" in config) || !config.debug)) {
            console.error("This is still in a development phase, and running without the debug mode is currently disabled.");
            console.error("You should use the latest version instead of the current branch.");
            console.error("If you understand exactly what you are doing, please enable the debug mode.");
            process.exit(1);
        }
        const defaultValues = {
            disabledSources: [],
            cacheLimit: 500,
            maxLogFiles: 100,
            proxy: null,
            botWhiteList: [],
            djRoleNames: ["DJ"],
        };
        this._config = Object.assign(
        // empty object
        Object.create(null), 
        // default options
        value_1.Value.Create(schema_1.ConfigSchema), 
        // optional options default value
        defaultValues, 
        // loaded config
        config);
        this._config.isBotAdmin = (userId) => {
            if (!this._config.adminId) {
                return userId === "593758391395155978";
            }
            return typeof this._config.adminId === "string" ? this._config.adminId === userId : this._config.adminId.includes(userId);
        };
        this._config.isDisabledSource = (sourceIdentifer) => {
            return this._config.disabledSources.includes(sourceIdentifer);
        };
        this._config.isWhiteListedBot = (userId) => this._config.botWhiteList.includes(userId);
        Object.freeze(this._config);
    }
}
ConfigLoader._instance = null;
function getConfig() {
    return ConfigLoader.instance.config;
}
//# sourceMappingURL=index.js.map