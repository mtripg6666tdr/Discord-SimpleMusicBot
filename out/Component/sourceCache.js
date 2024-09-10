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
exports.SourceCache = void 0;
const tslib_1 = require("tslib");
const crypto_1 = tslib_1.__importDefault(require("crypto"));
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const stream_1 = require("stream");
const zlib_1 = tslib_1.__importDefault(require("zlib"));
const async_lock_1 = require("@mtripg6666tdr/async-lock");
const Structure_1 = require("../Structure");
const decorators_1 = require("../Util/decorators");
const system_1 = require("../Util/system");
const config_1 = require("../config");
const config = (0, config_1.getConfig)();
let SourceCache = (() => {
    var _a;
    let _classSuper = Structure_1.LogEmitter;
    let _instanceExtraInitializers = [];
    let _onTick_decorators;
    return _a = class SourceCache extends _classSuper {
            constructor(bot, enablePersistent) {
                super("Cache");
                this.bot = (tslib_1.__runInitializers(this, _instanceExtraInitializers), bot);
                this.enablePersistent = enablePersistent;
                this.lastCleanup = 0;
                this.persistentCacheLocker = new async_lock_1.LockObj();
                this._sourceCache = new Map();
                this._expireMap = new Map();
                this.cacheDirPath = path_1.default.join(__dirname, global.BUNDLED ? "../cache/" : "../../cache/");
                if (!fs_1.default.existsSync(this.cacheDirPath)) {
                    fs_1.default.mkdirSync(this.cacheDirPath);
                }
                bot.on("tick", this.onTick.bind(this));
            }
            onTick(count) {
                if (count % 5 === 0 || config.debug) {
                    const now = Date.now();
                    let purgeCount = 0;
                    const shouldPurgeCount = this._sourceCache.size - 300;
                    [...this._expireMap.entries()].sort((a, b) => a[1] - b[1]).forEach(([url, expiresAt]) => {
                        if (now > expiresAt || purgeCount < shouldPurgeCount) {
                            this._sourceCache.delete(url);
                            this._expireMap.delete(url);
                            purgeCount++;
                        }
                    });
                    this.logger.debug(`${purgeCount} cache purged`);
                    const cacheToPurge = new Set(this._sourceCache.keys());
                    this.bot["guildData"].forEach(guild => {
                        guild.queue.forEach(item => {
                            cacheToPurge.delete(item.basicInfo.url);
                            this._expireMap.delete(item.basicInfo.url);
                        });
                    });
                    [...this._expireMap.keys()].forEach(url => cacheToPurge.delete(url));
                    cacheToPurge.forEach(url => this._expireMap.set(url, Date.now() + 4 * 60 * 60 * 1000));
                    this.logger.debug(`${this._expireMap.size} cache scheduled to be purged (total: ${this._sourceCache.size} stored)`);
                }
            }
            addSource(content, fromPersistentCache) {
                this._sourceCache.set(content.url, content);
                this.logger.info(`New memory cache added (total: ${this._sourceCache.size})`);
                if (this.enablePersistent && !fromPersistentCache) {
                    this.addPersistentCache(this.createCacheId(content.url, "exportable"), content.exportData()).catch(this.logger.error);
                }
            }
            hasSource(url) {
                if (url.includes("?si="))
                    url = url.split("?")[0];
                const result = this._sourceCache.has(url);
                this.logger.debug(`Requested memory cache ${result ? "" : "not "}found`);
                this.emit(result ? "memoryCacheHit" : "memoryCacheNotFound");
                return result;
            }
            getSource(url) {
                return this._sourceCache.get(url);
            }
            hasExportable(url) {
                const id = this.createCacheId(url, "exportable");
                const result = this.existPersistentCache(id);
                this.logger.info(`Requested persistent cache ${result ? "" : "not "}found (id: ${id})`);
                if (!result) {
                    this.emit("persistentCacheNotFound");
                }
                return result;
            }
            getExportable(url) {
                return this.getPersistentCache(this.createCacheId(url, "exportable"))
                    .then(data => {
                    this.emit(data ? "persistentCacheHit" : "persistentCacheNotFound");
                    return data;
                })
                    .catch(() => null);
            }
            addSearch(keyword, result) {
                if (this.enablePersistent) {
                    this.addPersistentCache(this.createCacheId(keyword.toLowerCase(), "search"), result).catch(this.logger.error);
                }
            }
            hasSearch(keyword) {
                const id = this.createCacheId(keyword, "search");
                const result = this.existPersistentCache(id);
                this.logger.info(`Requested persistent cache ${result ? "" : "not "}found (id: ${id})`);
                return result;
            }
            getSearch(keyword) {
                return this.getPersistentCache(this.createCacheId(keyword, "search"));
            }
            getMemoryCacheState() {
                return {
                    totalCount: this._sourceCache.size,
                    purgeScheduled: this._expireMap.size,
                };
            }
            purgeMemoryCache() {
                this._sourceCache.clear();
                this._expireMap.clear();
            }
            getPersistentCacheSize() {
                return fs_1.default.promises.readdir(this.cacheDirPath, { withFileTypes: true })
                    .then(files => Promise.allSettled(files
                    .filter(file => file.isFile())
                    .map(file => fs_1.default.promises.stat(path_1.default.join(this.cacheDirPath, file.name)))))
                    .then(sizes => sizes.filter(d => d.status === "fulfilled").reduce((prev, current) => prev + current.value.size, 0));
            }
            purgePersistentCache() {
                return fs_1.default.promises.readdir(this.cacheDirPath, { withFileTypes: true })
                    .then(files => Promise.allSettled(files
                    .filter(file => file.isFile())
                    .map(file => fs_1.default.promises.unlink(path_1.default.join(this.cacheDirPath, file.name)))));
            }
            createCacheId(key, type) {
                if (key.includes("?si="))
                    key = key.split("?")[0];
                const id = this.generateHash(`${type}+${key}`);
                this.logger.debug(`type: ${type}, id: ${id}`);
                return id;
            }
            async addPersistentCache(cacheId, data) {
                return (0, async_lock_1.lock)(this.persistentCacheLocker, () => new Promise((resolve, reject) => {
                    (0, stream_1.pipeline)(stream_1.Readable.from(Buffer.from(JSON.stringify(data))), zlib_1.default.createBrotliCompress({
                        params: {
                            [zlib_1.default.constants.BROTLI_PARAM_MODE]: zlib_1.default.constants.BROTLI_MODE_TEXT,
                        },
                    }), fs_1.default.createWriteStream(this.getCachePath(cacheId)), er => {
                        if (er) {
                            reject(er);
                        }
                        else {
                            this.logger.info(`persistent cache (id: ${cacheId}) stored`);
                            resolve(this.cleanupCache());
                        }
                    });
                }));
            }
            // createWritePersistentCacheStream(cacheId: string){
            //   const persistentPath = this.getCachePath(cacheId);
            //   const tempPath = persistentPath + ".tmp";
            //   const gzip = zlib.createGzip();
            //   const file = fs.createWriteStream(tempPath);
            //   gzip
            //     .once("end", () => fs.rename(tempPath, persistentPath, () => {}))
            //     .on("error", () => {})
            //     .pipe(file);
            //   return gzip;
            // }
            existPersistentCache(cacheId) {
                return fs_1.default.existsSync(this.getCachePath(cacheId));
            }
            async getPersistentCache(cacheId) {
                if (!this.existPersistentCache(cacheId))
                    return null;
                return (0, async_lock_1.lock)(this.persistentCacheLocker, () => new Promise((resolve, reject) => {
                    const bufs = [];
                    fs_1.default.createReadStream(this.getCachePath(cacheId))
                        .pipe(zlib_1.default.createBrotliDecompress({
                        params: {
                            [zlib_1.default.constants.BROTLI_PARAM_MODE]: zlib_1.default.constants.BROTLI_MODE_TEXT,
                        },
                    }))
                        .on("data", chunk => bufs.push(chunk))
                        .on("end", () => {
                        resolve(JSON.parse(Buffer.concat(bufs).toString()));
                        this.logger.info(`persistent cache (id: ${cacheId}) restored.`);
                    })
                        .on("error", reject);
                }));
            }
            getCachePath(cacheId) {
                return `${this.cacheDirPath}${cacheId}.bin2`;
            }
            generateHash(content) {
                return crypto_1.default.createHash("md5")
                    .update(Buffer.from(content))
                    .digest("hex");
            }
            async cleanupCache() {
                if (config.cacheLimit > 0) {
                    if (Date.now() - this.lastCleanup < 3 * 60 * 60 * 1000)
                        return;
                    this.logger.info("Start cleaning up cache files");
                    this.lastCleanup = Date.now();
                    const maxSize = config.cacheLimit * 1024 * 1024;
                    this.logger.info(`Configured cache limit is ${config.cacheLimit}MB`);
                    const items = await fs_1.default.promises.readdir(this.cacheDirPath, { withFileTypes: true });
                    const files = await Promise.allSettled(items.filter(d => d.isFile()).map(async (d) => {
                        const filePath = path_1.default.join(this.cacheDirPath, d.name);
                        const stats = await fs_1.default.promises.stat(filePath);
                        return {
                            path: filePath,
                            lastAccess: stats.atimeMs,
                            size: stats.size,
                        };
                    }))
                        .then(ss => ss.map(d => "value" in d ? d.value : null).filter(d => d));
                    files.sort((a, b) => a.lastAccess - b.lastAccess);
                    const currentTotalSize = files.reduce((prev, current) => prev + current.size, 0);
                    this.logger.info(`Current total cache size: ${(0, system_1.getMBytes)(currentTotalSize)}MB`);
                    if (currentTotalSize > maxSize) {
                        this.logger.info("Searching stale caches...");
                        const reduceSize = currentTotalSize - maxSize;
                        const removePaths = [];
                        let current = 0;
                        for (let i = 0; i < files.length; i++) {
                            current += files[i].size;
                            removePaths.push(files[i].path);
                            if (current >= reduceSize) {
                                break;
                            }
                        }
                        this.logger.info(`${removePaths.length} caches will be purged and ${(0, system_1.getMBytes)(current)}MB disk space will be freed.`);
                        await Promise.allSettled(removePaths.map(logPath => fs_1.default.promises.unlink(logPath)));
                        this.logger.info("Cleaning up completed.");
                    }
                    else {
                        this.logger.info("Skip deleting");
                    }
                }
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _onTick_decorators = [decorators_1.measureTime];
            tslib_1.__esDecorate(_a, null, _onTick_decorators, { kind: "method", name: "onTick", static: false, private: false, access: { has: obj => "onTick" in obj, get: obj => obj.onTick }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.SourceCache = SourceCache;
//# sourceMappingURL=sourceCache.js.map