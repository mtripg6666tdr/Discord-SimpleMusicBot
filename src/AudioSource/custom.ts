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

import type { AudioSourceBasicJsonFormat, StreamInfo } from ".";
import type { i18n } from "i18next";

import { AudioSource } from "./audiosource";
import { createFragmentalDownloadStream, downloadAsReadable, isAvailableRawAudioURL, requestHead, retrieveRemoteAudioInfo } from "../Util";

export class CustomStream extends AudioSource<string, AudioSourceBasicJsonFormat> {
  constructor(){
    super({ isCacheable: false });
  }

  async init(url: string, prefetched: AudioSourceBasicJsonFormat | null, t: i18n["t"]){
    if(prefetched){
      this.title = prefetched.title || t("audioSources.customStream");
      this.url = url;
      this.lengthSeconds = prefetched.length;
    }else if(isAvailableRawAudioURL(url)){
      this.url = url;
      const info = await retrieveRemoteAudioInfo(url);
      this.title = info.displayTitle || this.extractFilename() || t("audioSources.customStream");
      this.lengthSeconds = info.lengthSeconds || 0;
    }else{
      throw new Error(t("audioSources.invalidStream"));
    }

    this.isPrivateSource = this.url.startsWith("https://cdn.discordapp.com/ephemeral-attachments/");

    return this;
  }

  async fetch(url?: boolean): Promise<StreamInfo>{
    if(url){
      return {
        type: "url",
        url: this.url,
        streamType: "unknown",
      };
    }

    const headRes = await requestHead(this.url);
    const acceptRanges = headRes.headers["accept-ranges"];
    const contentLengthStr = headRes.headers["content-length"];
    const stream = acceptRanges?.includes("bytes") && contentLengthStr && /^\d+$/.test(contentLengthStr)
      ? createFragmentalDownloadStream(this.url, { contentLength: Number(contentLengthStr) })
      : downloadAsReadable(this.url);

    return {
      type: "readable",
      stream,
      streamType: "unknown",
    };
  }

  toField(_: boolean, t: i18n["t"]){
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

  npAdditional(){
    return "";
  }

  exportData(): AudioSourceBasicJsonFormat{
    return {
      url: this.url,
      length: this.lengthSeconds,
      title: this.title,
    };
  }

  private extractFilename(){
    const url = new URL(this.url);
    return url.pathname.split("/").at(-1);
  }
}

