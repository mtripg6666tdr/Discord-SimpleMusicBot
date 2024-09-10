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
const tslib_1 = require("tslib");
require("../../polyfill");
const worker_threads_1 = require("worker_threads");
const ytsr_1 = tslib_1.__importDefault(require("ytsr"));
const _1 = require(".");
const strategies_1 = require("./strategies");
const Util_1 = require("../../Util");
const config_1 = require("../../config");
const dYtsr = (0, Util_1.requireIfAny)("@distube/ytsr");
if (!worker_threads_1.parentPort) {
    throw new Error("This file should be run in worker thread.");
}
const config = (0, config_1.getConfig)();
const searchOptions = {
    limit: 12,
    gl: config.country,
    hl: config.defaultLanguage,
};
worker_threads_1.parentPort.unref();
worker_threads_1.parentPort.on("message", onMessage);
function postMessage(message) {
    worker_threads_1.parentPort.postMessage(message);
}
function getInfo({ id, url, prefetched, forceCache }) {
    const youtube = new _1.YouTube();
    youtube.init(url, prefetched, forceCache)
        .then(() => {
        const data = Object.assign({}, youtube);
        // @ts-expect-error
        delete data["logger"];
        postMessage({
            type: "initOk",
            data,
            id,
        });
    })
        .catch((er) => {
        postMessage({
            type: "error",
            data: (0, Util_1.stringifyObject)(er),
            id,
        });
    });
}
function search({ id, keyword }) {
    if (dYtsr) {
        dYtsr(keyword, searchOptions)
            // @ts-ignore
            .then(result => {
            postMessage({
                type: "searchOk",
                data: result,
                id,
            });
        })
            // @ts-ignore
            .catch((err) => {
            console.error(err);
            return (0, ytsr_1.default)(keyword, searchOptions);
        })
            // @ts-ignore
            .catch(err => {
            postMessage({
                type: "error",
                data: (0, Util_1.stringifyObject)(err),
                id,
            });
        });
        return;
    }
    (0, ytsr_1.default)(keyword, searchOptions)
        .then(result => {
        postMessage({
            type: "searchOk",
            data: result,
            id,
        });
    })
        .catch((err) => {
        postMessage({
            type: "error",
            data: (0, Util_1.stringifyObject)(err),
            id,
        });
    });
}
function updateConfig({ config: newConfig }) {
    (0, strategies_1.updateStrategyConfiguration)(newConfig);
}
function onMessage(message) {
    if (!message) {
        return;
    }
    switch (message.type) {
        case "init":
            getInfo(message);
            break;
        case "search":
            search(message);
            break;
        case "updateConfig":
            updateConfig(message);
            break;
    }
}
//# sourceMappingURL=worker.js.map