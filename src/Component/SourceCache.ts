/*
 * Copyright 2021-2023 mtripg6666tdr
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

import type { AudioSource, exportableCustom } from "../AudioSource";
import type { MusicBotBase } from "../botBase";
import type ytsr from "ytsr";

import { lock, LockObj } from "@mtripg6666tdr/async-lock";

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pipeline, Readable } from "stream";
import zlib from "zlib";

import { LogEmitter } from "../Structure";

interface CacheEvents {
  cacheAdd: [];
  cacheDelete: [];
}

export class SourceCache extends LogEmitter<CacheEvents> {
  private readonly _sourceCache: Map<string, AudioSource<any>> = null;
  private readonly _expireMap: Map<string, number> = null;
  private readonly cacheDirPath: string;

  constructor(protected bot: MusicBotBase, protected enablePersistent: boolean){
    super("Cache");
    this._sourceCache = new Map();
    this._expireMap = new Map();
    this.cacheDirPath = path.join(__dirname, "../../cache/");
    if(!fs.existsSync(this.cacheDirPath)){
      fs.mkdirSync(this.cacheDirPath);
    }
    bot.on("tick", this.onTick.bind(this));
  }

  private onTick(count: number){
    if(count % 5 === 0){
      const now = Date.now();
      let purgeCount = 0;
      this._expireMap.forEach((expiresAt, url) => {
        if(now > expiresAt){
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
      this.logger.debug(`${this._expireMap.size} cache scheduled to be purge (total: ${this._sourceCache.size} stored)`);
    }
  }

  addSource(content: AudioSource<any>, fromPersistentCache: boolean){
    this._sourceCache.set(content.url, content);
    this.logger.info(`New memory cache added (total: ${this._sourceCache.size})`);
    if(this.enablePersistent && !fromPersistentCache){
      this.addPersistentCache(this.createCacheId(content.url, "exportable"), content.exportData());
    }
  }

  hasSource(url: string){
    if(url.includes("?si=")) url = url.split("?")[0];
    const result = this._sourceCache.has(url);
    this.logger.info(`Requested memory cache ${result ? "" : "not "}found`);
    return result;
  }

  getSource(url: string){
    return this._sourceCache.get(url);
  }

  hasExportable(url: string){
    const id = this.createCacheId(url, "exportable");
    const result = this.existPersistentCache(id);
    this.logger.info(`Requested persistent cache ${result ? "" : "not "}found (id: ${id})`);
    return result;
  }

  getExportable<T extends exportableCustom>(url: string){
    return this.getPersistentCache(this.createCacheId(url, "exportable")) as Promise<T>;
  }

  addSearch(keyword: string, result: ytsr.Video[]){
    if(this.enablePersistent){
      this.addPersistentCache(this.createCacheId(keyword.toLowerCase(), "search"), result);
    }
  }

  hasSearch(keyword: string){
    const id = this.createCacheId(keyword, "search");
    const result = this.existPersistentCache(id);
    this.logger.info(`Requested persistent cache ${result ? "" : "not "}found (id: ${id})`);
    return result;
  }

  getSearch(keyword: string){
    return this.getPersistentCache(this.createCacheId(keyword, "search")) as Promise<ytsr.Video[]>;
  }

  private createCacheId(key: string, type: "exportable" | "search"){
    if(key.includes("?si=")) key = key.split("?")[0];
    const id = this.generateHash(`${type}+${key}`);
    this.logger.debug(`type: ${type}, id: ${id}`);
    return id;
  }

  private readonly persistentCacheLocker = new LockObj();

  async addPersistentCache(cacheId: string, data: any){
    return lock(this.persistentCacheLocker, () => new Promise<void>((resolve, reject) => {
      pipeline(
        Readable.from(Buffer.from(JSON.stringify(data))),
        zlib.createGzip(),
        fs.createWriteStream(this.getCachePath(cacheId)),
        er => {
          if(er){
            reject(er);
          }else{
            this.logger.info(`persistent cache (id: ${cacheId}) stored`);
            resolve();
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

  existPersistentCache(cacheId: string){
    return fs.existsSync(this.getCachePath(cacheId));
  }

  async getPersistentCache(cacheId: string){
    if(!this.existPersistentCache(cacheId)) return null;
    return lock(this.persistentCacheLocker, () => new Promise<any>((resolve, reject) => {
      const bufs: Buffer[] = [];
      fs.createReadStream(this.getCachePath(cacheId))
        .pipe(zlib.createGunzip())
        .on("data", chunk => bufs.push(chunk))
        .on("end", () => {
          resolve(JSON.parse(Buffer.concat(bufs).toString()));
          this.logger.info(`persistent cache (id: ${cacheId}) restored.`);
        })
        .on("error", reject)
      ;
    }));
  }

  private getCachePath(cacheId: string){
    return `${this.cacheDirPath}${cacheId}.bin`;
  }

  private generateHash(content: string){
    return crypto.createHash("md5")
      .update(Buffer.from(content))
      .digest("hex");
  }
}
