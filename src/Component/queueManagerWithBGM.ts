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

import type { KnownAudioSourceIdentifer } from "./queueManager";
import type { GuildDataContainerWithBgm } from "../Structure/GuildDataContainerWithBgm";
import type { AddedBy, QueueContent } from "../types/QueueContent";
import type { Member } from "oceanic.js";

import * as fs from "fs";
import * as path from "path";


import { QueueManager } from "./queueManager";
import * as AudioSource from "../AudioSource";

export class QueueManagerWithBgm extends QueueManager {
  protected override server: GuildDataContainerWithBgm;
  protected _bgmDefault: QueueContent[] = [];
  protected _bgmInitial: QueueContent[] = [];

  protected _isBGM: boolean = false;
  get isBGM() {
    return this._isBGM;
  }

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(parent: GuildDataContainerWithBgm) {
    super(parent);
  }

  moveCurrentTracksToBGM() {
    this._bgmDefault = [...this._default];
    this._bgmInitial = [...this._default];
    this._default = [];
    this.logger.info(`Moved ${this._bgmDefault.length} tracks to bgm queue, and the default queue is now empty`);
  }

  resetBgmTracks() {
    this._bgmDefault = [...this._bgmInitial];
  }

  setToPlayBgm(val: boolean = true) {
    this._isBGM = val;
  }

  get bgmLength() {
    return this._bgmDefault.length;
  }

  get isBgmEmpty() {
    return this._bgmDefault.length === 0;
  }

  override get(index: number) {
    return this.isBGM ? this._bgmDefault[index] : super.get(index);
  }

  override async addQueueOnly<T extends AudioSource.AudioSourceBasicJsonFormat>({
    url,
    addedBy,
    method = "push",
    sourceType = "unknown",
    gotData = null,
    preventCache = false,
  }: {
    url: string,
    addedBy: Member | AddedBy | null,
    method?: "push" | "unshift",
    sourceType?: KnownAudioSourceIdentifer,
    gotData?: T | null,
    preventCache?: boolean,
  }): Promise<QueueContent & { index: number }> {
    if (
      !url.startsWith("http://")
      && !url.startsWith("https://")
      && fs.existsSync(path.join(__dirname, global.BUNDLED ? "../" : "../../", url))
    ) {
      const result: QueueContent = {
        basicInfo: await new AudioSource.FsStream().init(url, null),
        additionalInfo: {
          addedBy: {
            userId: addedBy && this.getUserIdFromMember(addedBy) || "0",
            displayName: addedBy?.displayName || "unknown",
          },
        },
      };

      this._default[method](result);

      if (this.server.preferences.equallyPlayback) {
        this.sortByAddedBy();
      }

      const index = this._default.findIndex(q => q === result);

      return { ...result, index };
    }
    return super.addQueueOnly({ url, addedBy, method, sourceType, gotData, preventCache });
  }

  override async next() {
    if (this.isBGM) {
      this.server.player.resetError();
      if (this.server.bgmConfig.enableQueueLoop) {
        this._bgmDefault.push(this._bgmDefault[0]);
      }
      this._bgmDefault.shift();
    } else {
      return super.next();
    }
  }
}
