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

export abstract class BaseController {
  get logger() {
    return this.utils.logger;
  }

  get cacheIdPrefix() {
    return "default";
  }

  constructor(protected readonly parent: CacheController, protected readonly utils: CacheControllerSharedUtils) {}

  createCacheId(key: string) {
    const id = this.utils.generateHash(`${this.cacheIdPrefix}+${key}`);
    this.logger.debug(`type: ${this.cacheIdPrefix}, id: ${id}`);
    return id;
  }
}
