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

import type { AudioSourceBasicJsonFormat, ReadableStreamInfo, StreamInfo, UrlStreamInfo } from ".";

import candyget from "candyget";

import { AudioSource } from "./audiosource";
import { getCommandExecutionContext } from "../Commands";
import { createFragmentalDownloadStream, getResourceTypeFromUrl, retrieveRemoteAudioInfo } from "../Util";
import { DefaultUserAgent } from "../definition";

export class CustomStream extends AudioSource<string, AudioSourceBasicJsonFormat> {
  constructor() {
    super({ isCacheable: false });
  }

  async init(url: string, prefetched: AudioSourceBasicJsonFormat | null) {
    const { t } = getCommandExecutionContext();

    if (prefetched) {
      this.title = prefetched.title || t("audioSources.customStream");
      this.url = url;
      this.lengthSeconds = prefetched.length;
    } else if (getResourceTypeFromUrl(url) !== "none") {
      this.url = url;
      const info = await retrieveRemoteAudioInfo(url);
      this.title = info.displayTitle || this.extractFilename() || t("audioSources.customStream");
      this.lengthSeconds = info.lengthSeconds || 0;
    } else {
      throw new Error(t("audioSources.invalidStream"));
    }

    this.isPrivateSource = this.url.startsWith("https://cdn.discordapp.com/ephemeral-attachments/");

    return this;
  }

  async fetch(): Promise<StreamInfo> {
    const canBeWithVideo = getResourceTypeFromUrl(this.url) === "video";

    if (!canBeWithVideo) {
      const { statusCode, headers } = await candyget.head(this.url, {
        headers: {
          "User-Agent": DefaultUserAgent,
        },
      });

      if (200 <= statusCode && statusCode < 300 && headers["content-length"] && headers["accept-ranges"]?.includes("bytes")) {
        return {
          type: "readable",
          stream: createFragmentalDownloadStream(this.url, {
            chunkSize: 1 * 1024 * 1024,
            contentLength: Number(headers["content-length"]),
            userAgent: DefaultUserAgent,
          }),
          streamType: "unknown",
        } satisfies ReadableStreamInfo;
      }
    }

    return {
      type: "url",
      url: this.url,
      streamType: "unknown",
      canBeWithVideo,
    } satisfies UrlStreamInfo;
  }

  toField(_: boolean) {
    const { t } = getCommandExecutionContext();

    return [
      {
        name: ":link:URL",
        value: this.url,
      },
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

  private extractFilename() {
    const url = new URL(this.url);
    return url.pathname.split("/").at(-1);
  }
}

