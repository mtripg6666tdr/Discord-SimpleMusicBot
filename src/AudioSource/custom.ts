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

import type { UrlStreamInfo } from ".";
import type { i18n } from "i18next";

import { AudioSource } from "./audiosource";
import { isAvailableRawAudioURL, retriveLengthSeconds } from "../Util";

export class CustomStream extends AudioSource<string> {
  constructor(){
    super("custom");
    this._unableToCache = true;
  }

  async init(url: string, prefetched: exportableCustom, t: i18n["t"]){
    if(prefetched){
      this.title = prefetched.title || t("audioSources.customStream");
      this.url = url;
      this.lengthSeconds = prefetched.length;
    }else{
      if(!isAvailableRawAudioURL(url)){
        throw new Error(t("audioSources.invalidStream"));
      }
      this.url = url;
      this.title = this.extractFilename() || t("audioSources.customStream");
      try{
        this.lengthSeconds = await retriveLengthSeconds(url);
      }
      catch{ /* empty */ }
    }

    this.isPrivateSource = this.url.startsWith("https://cdn.discordapp.com/ephemeral-attachments/");

    return this;
  }

  async fetch(): Promise<UrlStreamInfo>{
    return {
      type: "url",
      url: this.url,
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

  exportData(): exportableCustom{
    return {
      url: this.url,
      length: this.lengthSeconds,
      title: this.title,
    };
  }

  private extractFilename(){
    const paths = this.url.split("/");
    return paths[paths.length - 1];
  }
}

export type exportableCustom = {
  url: string,
  length: number,
  title: string,
};
