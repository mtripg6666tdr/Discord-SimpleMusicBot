/*
 * Copyright 2021-2025 mtripg6666tdr
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

import type { MusicBotBase } from "../../botBase";
import type { LoggerObject } from "../../logger";
import type { Writable } from "stream";

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { pipeline, Readable } from "stream";
import zlib from "zlib";

import { createPassThrough, stringifyObject } from "../../Util";
import { destroyStream } from "../../Util/stream";
import { getMBytes } from "../../Util/system";
import { getConfig } from "../../config";

const config = getConfig();

export class CacheControllerSharedUtils {
  private lastCleanup: number = 0;
  private readonly cacheDirPath: string;
  private readonly writingCacheId: Set<string> = new Set();
  private readonly encyrptionKey = crypto.scryptSync(crypto.randomBytes(16), "salt", 16);
    private readonly encryptionIv = crypto.randomBytes(16);
    private readonly cacheIdSalt = crypto.randomBytes(8).toString("hex");

    constructor(public readonly logger: LoggerObject, public readonly bot: MusicBotBase) {
      this.cacheDirPath = path.join(__dirname, global.BUNDLED ? "../cache/" : "../../../cache/");
      if (!fs.existsSync(this.cacheDirPath)) {
        fs.mkdirSync(this.cacheDirPath);
      }
    }

    get config() {
      return config;
    }

    generateHash(content: string) {
      return crypto.createHash("md5")
        .update(Buffer.from(content))
        .digest("hex");
    }

    getCacheFileName(cacheId: string) {
      return `${cacheId}.bin2`;
    }

    getCachePath(cacheId: string) {
      return `${this.cacheDirPath}${this.getCacheFileName(cacheId)}`;
    }

    getPersistentCacheSize() {
      return fs.promises.readdir(this.cacheDirPath, { withFileTypes: true })
        .then(files => Promise.allSettled(
          files
            .filter(file => file.isFile())
            .map(file => fs.promises.stat(path.join(this.cacheDirPath, file.name))),
        ))
        .then(sizes =>
          sizes.filter(d => d.status === "fulfilled").reduce((prev, current) => prev + current.value.size, 0),
        );
    }

    purgePersistentCache() {
      return fs.promises.readdir(this.cacheDirPath, { withFileTypes: true })
        .then(files => Promise.allSettled(
          files
            .filter(file => file.isFile())
            .map(file => fs.promises.unlink(path.join(this.cacheDirPath, file.name))),
        ));
    }

    async addPersistentCache(cacheId: string, data: any, force = false) {
      if (cacheId.endsWith(".enc") && !force) {
        throw new Error("Use createPersistentCacheStream() for encrypted cache.");
      }

      if (this.writingCacheId.has(cacheId)) {
        return;
      }

      this.writingCacheId.add(cacheId);

      return new Promise<void>((resolve, reject) => {
        pipeline(
          data instanceof Readable ? data : Readable.from(Buffer.from(JSON.stringify(data))),
          zlib.createBrotliCompress({
            params: {
              [zlib.constants.BROTLI_PARAM_MODE]: data instanceof Readable
                ? zlib.constants.BROTLI_MODE_GENERIC
                : zlib.constants.BROTLI_MODE_TEXT,
            },
          }),
          fs.createWriteStream(this.getCachePath(cacheId)),
          er => {
            this.writingCacheId.delete(cacheId);

            if (er) {
              this.logger.info(`persistent cache (id: ${cacheId}) failed to store: ${stringifyObject(er)}`);
              reject(er);
            } else {
              this.logger.info(`persistent cache (id: ${cacheId}) stored`);
              resolve(this.cleanupCache());
            }
          },
        );
      });
    }

    createPersistentCacheStream(cacheId: string): Writable {
      const stream = createPassThrough();
      const tempCacheId = `temp-${cacheId}`;
      this.addPersistentCache(tempCacheId, stream, true)
        .then(() => fs.promises.rename(this.getCachePath(tempCacheId), this.getCachePath(cacheId)))
        .catch(this.logger.error);

      if (cacheId.endsWith(".enc")) {
        const cipherStream = crypto.createCipheriv("aes-128-cbc", this.encyrptionKey, this.encryptionIv, {
          allowHalfOpen: false,
        });

        cipherStream
          .once("error", err => destroyStream(stream, err))
          .pipe(stream)
          .once("close", () => destroyStream(cipherStream));

        return cipherStream;
      } else {
        return stream;
      }
    }

    existPersistentCache(cacheId: string) {
      return fs.existsSync(this.getCachePath(cacheId));
    }

    async getPersistentCache(cacheId: string) {
      if (!this.existPersistentCache(cacheId)) return null;
      return new Promise<any>((resolve, reject) => {
        const bufs: Buffer[] = [];
        this.getPersistentCacheStream(cacheId)
          .on("data", chunk => bufs.push(chunk))
          .on("end", () => {
            resolve(JSON.parse(Buffer.concat(bufs).toString()));
          })
          .on("error", reject)
        ;
      });
    }

    getPersistentCacheStream(cacheId: string): Readable {
      const filePath = this.getCachePath(cacheId);
      if (!fs.existsSync(filePath)) {
        throw new Error("Cache file not found.");
      }
      const reader = fs.createReadStream(filePath);
      const brotliDecompress = zlib.createBrotliDecompress();

      this.logger.info(`persistent cache (id: ${cacheId}) restored.`);

      if (cacheId.endsWith(".enc")) {
        const decipherStream = crypto.createDecipheriv("aes-128-cbc", this.encyrptionKey, this.encryptionIv);

        return reader
          .once("error", err => destroyStream(brotliDecompress, err))
          .pipe(brotliDecompress)
          .once("close", () => destroyStream(reader))
          .once("error", err => destroyStream(decipherStream, err))
          .pipe(decipherStream)
          .once("close", () => destroyStream(brotliDecompress));
      } else {
        return reader
          .once("error", err => destroyStream(brotliDecompress, err))
          .pipe(brotliDecompress)
          .once("close", () => destroyStream(reader));
      }
    }

    async getCacheFileInfos() {
      const items = await fs.promises.readdir(this.cacheDirPath, { withFileTypes: true });
      const filePs = await Promise.allSettled(
        items.filter(d => d.isFile()).map(async d => {
          const filePath = path.join(this.cacheDirPath, d.name);
          const stats = await fs.promises.stat(filePath);
          return {
            path: filePath,
            lastAccess: stats.atimeMs,
            size: stats.size,
          };
        }),
      );
      const files = filePs.map(d => "value" in d ? d.value : null).filter(d => d);
      return files;
    }

    async cleanupCache() {
      if (config.cacheLimit > 0) {
        if (Date.now() - this.lastCleanup < 3 * 60 * 60 * 1000) return;
        this.logger.info("Start cleaning up cache files");
        this.lastCleanup = Date.now();

        const maxSize = config.cacheLimit * 1024 * 1024;
        this.logger.info(`Configured cache limit is ${config.cacheLimit}MB`);

        const files = await this.getCacheFileInfos();
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

    async cleanupCacheKeyEndsWith(searchString: string) {
      const files = await this.getCacheFileInfos();

      await Promise.allSettled(
        files.filter(file => file!.path.endsWith(this.getCacheFileName(searchString))).map(file => fs.promises.unlink(file!.path)),
      );
    }
}
