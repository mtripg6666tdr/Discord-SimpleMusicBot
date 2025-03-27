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

import type { AudioSourceBasicJsonFormat } from "../../AudioSource";

import { BaseController } from "./baseController";

export class ExportableAudioSourceCacheController extends BaseController {
  override get cacheIdPrefix() {
    return "exportable";
  }

  has(url: string) {
    const id = this.createCacheId(url);
    const result = this.utils.existPersistentCache(id);
    this.logger.info(`Requested persistent cache ${result ? "" : "not "}found (id: ${id})`);
    return result;
  }

  get<T extends AudioSourceBasicJsonFormat>(url: string) {
    return this.utils.getPersistentCache(this.createCacheId(url))
      .catch(() => null) as Promise<T>;
  }

  async add<T extends AudioSourceBasicJsonFormat>(url: string, data: T) {
    if (this.parent.enablePersistent) {
      await this.utils.addPersistentCache(this.createCacheId(url), data)
        .catch(this.logger.error);
    }
  }

  override createCacheId(key: string): string {
    if (key.includes("?si=")) key = key.split("?")[0];
    return super.createCacheId(key);
  }
}
