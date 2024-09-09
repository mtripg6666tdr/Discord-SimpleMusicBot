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

import type { AudioSourceBasicJsonFormat, ReadableStreamInfo } from "./audiosource";

import * as fs from "fs";
import * as path from "path";

import { AudioSource } from "./audiosource";
import { getCommandExecutionContext } from "../Commands";
import { retrieveRemoteAudioInfo } from "../Util";

export class FsStream extends AudioSource<string, AudioSourceBasicJsonFormat> {
  constructor() {
    super({ isCacheable: false });
  }

  async init(url: string, _: AudioSourceBasicJsonFormat | null) {
    const { t } = getCommandExecutionContext();
    
    this.url = url;
    const info = await retrieveRemoteAudioInfo(url);
    this.title = info.displayTitle || t("audioSources.customStream");
    this.lengthSeconds = info.lengthSeconds || 0;
    return this;
  }

  async fetch(): Promise<ReadableStreamInfo> {
    return {
      type: "readable",
      stream: fs.createReadStream(path.join(__dirname, global.BUNDLED ? "../" : "../../", this.url)),
      streamType: "unknown",
    };
  }

  toField(_: boolean) {
    const { t } = getCommandExecutionContext();

    return [
      {
        name: `:asterisk:${t("moreInfo")}`,
        value: t("audioSources.customStream"),
      },
    ];
  }

  npAdditional() {
    return "";
  }

  exportData(): AudioSourceBasicJsonFormat {
    return {
      url: this.url,
      length: this.lengthSeconds,
      title: this.title,
    };
  }
}
