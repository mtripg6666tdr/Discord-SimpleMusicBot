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

import { AudioSourceCacheController } from "./audioSource";
import { ExportableAudioSourceCacheController } from "./exportableAudioSource";
import { SearchCacheController } from "./search";
import { CacheControllerSharedUtils } from "./sharedUtils";
import { LogEmitter } from "../../Structure";

interface CacheEvents {
  memoryCacheHit: [];
  memoryCacheNotFound: [];
  persistentCacheHit: [];
  persistentCacheNotFound: [];
  tick: [count: number];
}

export class CacheController extends LogEmitter<CacheEvents> {
  private readonly _sharedUtils: CacheControllerSharedUtils;

  private readonly _enablePersistent: boolean;
  get enablePersistent() {
    return this._enablePersistent;
  }

  private readonly _audioSource: AudioSourceCacheController;
  get audioSource() {
    return this._audioSource;
  }

  private readonly _exportableAudioSource: ExportableAudioSourceCacheController;
  get exportableAudioSource() {
    return this._exportableAudioSource;
  }

  private readonly _search: SearchCacheController;
  get search() {
    return this._search;
  }

  constructor(private readonly bot: MusicBotBase, enablePersistent: boolean) {
    super("Cache");
    this._enablePersistent = enablePersistent;
    this._sharedUtils = new CacheControllerSharedUtils(this.logger, this.bot);
    this._audioSource = new AudioSourceCacheController(this, this._sharedUtils);
    this._exportableAudioSource = new ExportableAudioSourceCacheController(this, this._sharedUtils);
    this._search = new SearchCacheController(this, this._sharedUtils);
    bot.on("tick", this.emit.bind(this, "tick" as const));
  }

  getPersistentCacheSize() {
    return this._sharedUtils.getPersistentCacheSize();
  }

  purgePersistentCache() {
    return this._sharedUtils.purgePersistentCache();
  }
}
