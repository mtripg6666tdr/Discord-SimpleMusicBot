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
import type { AudioSource } from "../../AudioSource";

import { BaseController } from "./baseController";
import { measureTime } from "../../Util/decorators";

export class AudioSourceCacheController extends BaseController {
    private readonly _sourceCache: Map<string, AudioSource<any, any>>;
    private readonly _expireMap: Map<string, number>;

    constructor(parent: CacheController, utils: CacheControllerSharedUtils) {
      super(parent, utils);
      this._sourceCache = new Map();
      this._expireMap = new Map();
      this.parent.on("tick", this.onTick.bind(this));
    }

    add(content: AudioSource<any, any>, fromPersistentCache: boolean) {
      this._sourceCache.set(content.url, content);
      this.logger.info(`New memory cache added (total: ${this._sourceCache.size})`);
      if (!fromPersistentCache) {
        this.parent.exportableAudioSource.add(content.url, content.exportData());
      }
    }

    has(url: string) {
      if (url.includes("?si=")) url = url.split("?")[0];
      const result = this._sourceCache.has(url);
      this.logger.debug(`Requested memory cache ${result ? "" : "not "}found`);
      return result;
    }

    get(url: string) {
      return this._sourceCache.get(url);
    }

    getStatistics() {
      return {
        totalCount: this._sourceCache.size,
        purgeScheduled: this._expireMap.size,
      };
    }

    purge() {
      this._sourceCache.clear();
      this._expireMap.clear();
    }

    @measureTime
    private onTick(count: number) {
      if (count % 5 === 0 || this.utils.config.debug) {
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
        this.utils.bot["guildData"].forEach(guild => {
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
}
