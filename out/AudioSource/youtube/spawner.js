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
exports.initYouTube = initYouTube;
exports.searchYouTube = searchYouTube;
exports.updateStrategyConfiguration = updateStrategyConfiguration;
const tslib_1 = require("tslib");
const crypto = tslib_1.__importStar(require("crypto"));
const path = tslib_1.__importStar(require("path"));
const worker_threads_1 = require("worker_threads");
const p_queue_1 = tslib_1.__importDefault(require("p-queue"));
const __1 = require("..");
const Util_1 = require("../../Util");
const logger_1 = require("../../logger");
const worker = worker_threads_1.isMainThread ? new worker_threads_1.Worker(path.join(__dirname, global.BUNDLED && __filename.includes("min") ? "./worker.min.js" : "./worker.js")).on("error", console.error) : null;
if (worker) {
    global.workerThread = worker;
}
const logger = (0, logger_1.getLogger)("Spawner");
const jobQueue = worker && new Map();
if (worker) {
    worker.unref();
    worker.on("message", (message) => {
        if (jobQueue.has(message.id)) {
            const { callback, start } = jobQueue.get(message.id);
            logger.debug(`Job(${message.id}) Finished (${Date.now() - start}ms)`);
            callback(message);
            jobQueue.delete(message.id);
        }
        else {
            logger.warn(`Invalid message received: ${(0, Util_1.stringifyObject)(message)}`);
        }
    });
}
const jobTriggerQueue = new p_queue_1.default({
    concurrency: 2,
    intervalCap: 4,
    interval: 12,
});
function doJob(message) {
    if (!worker) {
        throw new Error("Cannot send send messages from worker thread to itself.");
    }
    const uuid = crypto.randomUUID();
    logger.debug(`Job(${uuid}) Scheduled`);
    return jobTriggerQueue.add(() => new Promise((resolve, reject) => {
        worker.postMessage({
            ...message,
            id: uuid,
        });
        logger.debug(`Job(${uuid}) Started`);
        jobQueue.set(uuid, {
            start: Date.now(),
            callback: result => {
                if (result.type === "error") {
                    reject(result.data);
                }
                else {
                    resolve(result);
                }
            },
        });
    }));
}
async function initYouTube(url, prefetched, forceCache) {
    const result = await doJob({
        type: "init",
        url,
        prefetched,
        forceCache: !!forceCache,
    });
    return Object.assign(new __1.YouTube(), result.data);
}
async function searchYouTube(keyword) {
    const result = await doJob({
        type: "search",
        keyword,
    });
    return result.data;
}
function updateStrategyConfiguration(config) {
    worker?.postMessage({ type: "updateConfig", config, id: "0" });
}
//# sourceMappingURL=spawner.js.map