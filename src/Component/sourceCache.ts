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

import type { AudioSource, AudioSourceBasicJsonFormat } from "../AudioSource";
import type { MusicBotBase } from "../botBase";
import type dYtsr from "@distube/ytsr";
import type ytsr from "ytsr";

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pipeline, Readable } from "stream";
import zlib from "zlib";

import { lock, LockObj } from "@mtripg6666tdr/async-lock";

import { LogEmitter } from "../Structure";
import { measureTime } from "../Util/decorators";
import { getMBytes } from "../Util/system";
import { getConfig } from "../config";

interface CacheEvents {
  memoryCacheHit: [];
  memoryCacheNotFound: [];
  persistentCacheHit: [];
  persistentCacheNotFound: [];
}

const config = getConfig();

export class SourceCache extends LogEmitter<CacheEvents> {
  private readonly _sourceCache: Map<string, AudioSource<any, any>>;
  private readonly _expireMap: Map<string, number>;
  private readonly cacheDirPath: string;
  private lastCleanup: number = 0;

  constructor(protected bot: MusicBotBase, protected enablePersistent: boolean) {
    super("Cache");
    this._sourceCache = new Map();
    this._expireMap = new Map();
    this.cacheDirPath = path.join(__dirname, global.BUNDLED ? "../cache/" : "../../cache/");
    if (!fs.existsSync(this.cacheDirPath)) {
      fs.mkdirSync(this.cacheDirPath);
    }
    bot.on("tick", this.onTick.bind(this));
  }

  @measureTime
  private onTick(count: number) {
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

  addSource(content: AudioSource<any, any>, fromPersistentCache: boolean) {
    this._sourceCache.set(content.url, content);
    this.logger.info(`New memory cache added (total: ${this._sourceCache.size})`);
    if (this.enablePersistent && !fromPersistentCache) {
      this.addPersistentCache(this.createCacheId(content.url, "exportable"), content.exportData()).catch(this.logger.error);
    }
  }

  hasSource(url: string) {
    if (url.includes("?si=")) url = url.split("?")[0];
    const result = this._sourceCache.has(url);
    this.logger.debug(`Requested memory cache ${result ? "" : "not "}found`);
    this.emit(result ? "memoryCacheHit" : "memoryCacheNotFound");
    return result;
  }

  getSource(url: string) {
    return this._sourceCache.get(url);
  }

  hasExportable(url: string) {
    const id = this.createCacheId(url, "exportable");
    const result = this.existPersistentCache(id);
    this.logger.info(`Requested persistent cache ${result ? "" : "not "}found (id: ${id})`);
    if (!result) {
      this.emit("persistentCacheNotFound");
    }
    return result;
  }

  getExportable<T extends AudioSourceBasicJsonFormat>(url: string) {
    return this.getPersistentCache(this.createCacheId(url, "exportable"))
      .then(data => {
        this.emit(data ? "persistentCacheHit" : "persistentCacheNotFound");
        return data;
      })
      .catch(() => null) as Promise<T>;
  }

  addSearch(keyword: string, result: ytsr.Video[] | dYtsr.Video[]) {
    if (this.enablePersistent) {
      this.addPersistentCache(this.createCacheId(keyword.toLowerCase(), "search"), result).catch(this.logger.error);
    }
  }

  hasSearch(keyword: string) {
    const id = this.createCacheId(keyword, "search");
    const result = this.existPersistentCache(id);
    this.logger.info(`Requested persistent cache ${result ? "" : "not "}found (id: ${id})`);
    return result;
  }

  getSearch(keyword: string) {
    return this.getPersistentCache(this.createCacheId(keyword, "search")) as Promise<ytsr.Video[]>;
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
    return fs.promises.readdir(this.cacheDirPath, { withFileTypes: true })
      .then(files => Promise.allSettled(
        files
          .filter(file => file.isFile())
          .map(file => fs.promises.stat(path.join(this.cacheDirPath, file.name)))
      ))
      .then(sizes =>
        sizes.filter(d => d.status === "fulfilled").reduce((prev, current) => prev + current.value.size, 0)
      );
  }

  purgePersistentCache() {
    return fs.promises.readdir(this.cacheDirPath, { withFileTypes: true })
      .then(files => Promise.allSettled(
        files
          .filter(file => file.isFile())
          .map(file => fs.promises.unlink(path.join(this.cacheDirPath, file.name)))
      ));
  }

  private createCacheId(key: string, type: "exportable" | "search") {
    if (key.includes("?si=")) key = key.split("?")[0];
    const id = this.generateHash(`${type}+${key}`);
    this.logger.debug(`type: ${type}, id: ${id}`);
    return id;
  }

  private readonly persistentCacheLocker = new LockObj();

  async addPersistentCache(cacheId: string, data: any) {
    return lock(this.persistentCacheLocker, () => new Promise<void>((resolve, reject) => {
      pipeline(
        Readable.from(Buffer.from(JSON.stringify(data))),
        zlib.createBrotliCompress({
          params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          },
        }),
        fs.createWriteStream(this.getCachePath(cacheId)),
        er => {
          if (er) {
            reject(er);
          } else {
            this.logger.info(`persistent cache (id: ${cacheId}) stored`);
            resolve(this.cleanupCache());
          }
        }
      );
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

  existPersistentCache(cacheId: string) {
    return fs.existsSync(this.getCachePath(cacheId));
  }

  async getPersistentCache(cacheId: string) {
    if (!this.existPersistentCache(cacheId)) return null;
    return lock(this.persistentCacheLocker, () => new Promise<any>((resolve, reject) => {
      const bufs: Buffer[] = [];
      fs.createReadStream(this.getCachePath(cacheId))
        .pipe(zlib.createBrotliDecompress({
          params: {
            [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          },
        }))
        .on("data", chunk => bufs.push(chunk))
        .on("end", () => {
          resolve(JSON.parse(Buffer.concat(bufs).toString()));
          this.logger.info(`persistent cache (id: ${cacheId}) restored.`);
        })
        .on("error", reject)
      ;
    }));
  }

  private getCachePath(cacheId: string) {
    return `${this.cacheDirPath}${cacheId}.bin2`;
  }

  private generateHash(content: string) {
    return crypto.createHash("md5")
      .update(Buffer.from(content))
      .digest("hex");
  }

  private async cleanupCache() {
    if (config.cacheLimit > 0) {
      if (Date.now() - this.lastCleanup < 3 * 60 * 60 * 1000) return;
      this.logger.info("Start cleaning up cache files");
      this.lastCleanup = Date.now();

      const maxSize = config.cacheLimit * 1024 * 1024;
      this.logger.info(`Configured cache limit is ${config.cacheLimit}MB`);

      const items = await fs.promises.readdir(this.cacheDirPath, { withFileTypes: true });
      const files = await Promise.allSettled(
        items.filter(d => d.isFile()).map(async d => {
          const filePath = path.join(this.cacheDirPath, d.name);
          const stats = await fs.promises.stat(filePath);
          return {
            path: filePath,
            lastAccess: stats.atimeMs,
            size: stats.size,
          };
        })
      )
        .then(ss => ss.map(d => "value" in d ? d.value : null).filter(d => d));
      files.sort((a, b) => a!.lastAccess - b!.lastAccess);

      const currentTotalSize = files.reduce((prev, current) => prev + current!.size, 0);
      this.logger.info(`Current total cache size: ${getMBytes(currentTotalSize)}MB`);

      if (currentTotalSize > maxSize) {
        this.logger.info("Searching stale caches...");
        const reduceSize = currentTotalSize - maxSize;
        const removePaths: string[] = [];
        let current = 0;
        for (let i = 0; i < files.length; i++) {
          current += files[i]!.size;
          removePaths.push(files[i]!.path);
          if (current >= reduceSize) {
            break;
          }
        }

        this.logger.info(`${removePaths.length} caches will be purged and ${getMBytes(current)}MB disk space will be freed.`);

        await Promise.allSettled(removePaths.map(logPath => fs.promises.unlink(logPath)));
        this.logger.info("Cleaning up completed.");
      } else {
        this.logger.info("Skip deleting");
      }
    }
  }
}
