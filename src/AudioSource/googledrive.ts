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

import type { AudioSourceBasicJsonFormat, UrlStreamInfo } from ".";
import type { i18n } from "i18next";

import candyget from "candyget";
import * as htmlEntities from "html-entities";

import { AudioSource } from "./audiosource";
import { retrieveHttpStatusCode, retrieveRemoteAudioInfo } from "../Util";

export class GoogleDrive extends AudioSource<string, AudioSourceBasicJsonFormat> {
  constructor(){
    super({ isCacheable: false });
  }

  async init(url: string, prefetched: AudioSourceBasicJsonFormat | null, t: i18n["t"]){
    if(prefetched){
      this.title = prefetched.title || t("audioSources.driveStream");
      this.url = url;
      this.lengthSeconds = prefetched.length;
    }else{
      this.title = await GoogleDrive.retriveFilename(url);
      this.url = url;
      if(await retrieveHttpStatusCode(this.url) !== 200){
        throw new Error(t("urlNotFound"));
      }
      const info = await retrieveRemoteAudioInfo((await this.fetch()).url);
      this.lengthSeconds = info.lengthSeconds || 0;
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

  toField(_: boolean, t: i18n["t"]){
    return [
      {
        name: `:asterisk:${t("moreInfo")}`,
        value: t("audioSources.fileInDrive"),
      },
    ];
  }

  npAdditional(){
    return "";
  }

  exportData(): AudioSourceBasicJsonFormat {
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
    return match?.groups?.id || null;
  }

  static async retriveFilename(url: string){
    const source = await candyget.get(url, "string", { maxRedirects: 0 });
    if(source.statusCode !== 200){
      throw new Error("The requested file is not available right now.");
    }

    const name = source.body.match(/<meta property="og:title" content="(?<name>.+?)">/)?.groups?.name;

    if(!name){
      throw new Error("Something went wrong while fetching the file data.");
    }

    return htmlEntities.decode(name);
  }
}
