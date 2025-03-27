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

import type { CacheController } from ".";
import type { CacheControllerSharedUtils } from "./sharedUtils";
import type { AudioSource, ReadableStreamInfo, StreamInfo } from "../../AudioSource";

import { Readable } from "stream";

import { BaseController } from "./baseController";
import { createPassThrough } from "../../Util";
import { destroyStream } from "../../Util/stream";

export class AudioBinaryCacheController extends BaseController {
  override get cacheIdPrefix() {
    return "audioBinary";
  }

  constructor(parent: CacheController, utils: CacheControllerSharedUtils) {
    super(parent, utils);

    this.utils.cleanupCacheKeyEndsWith(".enc").catch(this.logger.error);
  }

  teeStream(url: string, streamInfo: StreamInfo, audioSource?: AudioSource<any, any>): StreamInfo {
    if (!this.parent.enableBinaryCache || (
      audioSource && (!audioSource.isCachable || audioSource.isPrivateSource || (audioSource.isYouTube() && audioSource.isLiveStream))
    )) {
      return streamInfo;
    }

    if (streamInfo.type === "readable") {
      const writableMeta: Omit<ReadableStreamInfo, "stream"> & { stream?: Readable } = { ...streamInfo };
      delete writableMeta.stream;

      const metaStream = Readable.from(Buffer.from(JSON.stringify(writableMeta)));
      metaStream
        .pipe(this.utils.createPersistentCacheStream(`${this.createCacheId(url)}.meta.enc`))
        .once("close", () => destroyStream(metaStream));

      const cacheStream = this.utils.createPersistentCacheStream(`${this.createCacheId(url)}.enc`);

      const teeStream = createPassThrough({
        highWaterMark: 0,
        transform(chunk, encoding, callback) {
          this.push(chunk, encoding);
          cacheStream.write(chunk, encoding);
          callback();
        },
        final(callback) {
          cacheStream.end();
          callback();
        },
      });

      const originalDestroy = teeStream._destroy;
      teeStream._destroy = (err, callback) => {
        cacheStream.destroy(err || undefined);
        originalDestroy.call(teeStream, err, callback);
      };

      return {
        ...streamInfo,
        stream: streamInfo.stream
          .once("error", err => destroyStream(teeStream, err))
          .pipe(teeStream)
          .once("close", () => destroyStream(streamInfo.stream)),
      };
    }

    return streamInfo;
  }

  has(url: string) {
    if (!this.parent.enableBinaryCache) {
      return false;
    }

    return this.utils.existPersistentCache(`${this.createCacheId(url)}.enc`);
  }

  async get(url: string): Promise<StreamInfo | null> {
    const cacheId = this.createCacheId(url);
    if (this.utils.existPersistentCache(`${cacheId}.enc`) && this.utils.existPersistentCache(`${cacheId}.meta.enc`)) {
      const meta = await this.utils.getPersistentCache(`${cacheId}.meta.enc`);
      const cache = this.utils.getPersistentCacheStream(`${cacheId}.enc`);

      return {
        ...meta,
        stream: cache,
      } as ReadableStreamInfo;
    }
    return null;
  }
}
