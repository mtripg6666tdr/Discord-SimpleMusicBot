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
import type { exportableCustom } from "./custom";

import i18next from "i18next";

import { AudioSource } from "./audiosource";
import { retriveHttpStatusCode, retriveLengthSeconds } from "../Util";

export class GoogleDrive extends AudioSource<string> {
  constructor(){
    super("googledrive");
    this._unableToCache = true;
  }

  async init(url: string, prefetched: exportableCustom){
    if(prefetched){
      this.title = prefetched.title || i18next.t("audioSources.driveStream");
      this.url = url;
      this.lengthSeconds = prefetched.length;
    }else{
      this.title = i18next.t("audioSources.driveStream");
      this.url = url;
      if(await retriveHttpStatusCode(this.url) !== 200){
        throw new Error(i18next.t("urlNotFound"));
      }
      try{
        this.lengthSeconds = await retriveLengthSeconds((await this.fetch()).url);
      }
      catch{ /* empty */ }
    }
    return this;
  }

  async fetch(): Promise<UrlStreamInfo>{
    const id = GoogleDrive.getId(this.url);
    return {
      type: "url",
      streamType: "unknown",
      url: `https://drive.google.com/uc?id=${id}`,
    };
  }

  toField(){
    return [
      {
        name: ":asterisk:詳細",
        value: i18next.t("audioSources.fileInDrive"),
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

  static validateUrl(url: string){
    return Boolean(url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([^/?]+)(\/.+)?$/));
  }

  static getId(url: string){
    const match = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/(?<id>[^/?]+)(\/.+)?$/);
    return match ? match.groups.id : null;
  }
}
