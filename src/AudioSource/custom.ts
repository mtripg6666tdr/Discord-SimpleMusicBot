/*
 * Copyright 2021-2022 mtripg6666tdr
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
import type { EmbedField } from "eris";

import { Util } from "../Util";
import { DefaultAudioThumbnailURL } from "../definition";
import { AudioSource } from "./audiosource";

export class CustomStream extends AudioSource {
  protected _lengthSeconds = 0;
  protected readonly _serviceIdentifer = "custom";
  Thumnail:string = DefaultAudioThumbnailURL;

  async init(url:string){
    if(!Util.fs.isAvailableRawAudioURL(url)) throw new Error("正しいストリームではありません");
    this.Url = url;
    this.Title = this.extractFilename() || "カスタムストリーム";
    try{
      this._lengthSeconds = await Util.web.RetriveLengthSeconds(url);
    }
    // eslint-disable-next-line no-empty
    catch{}
    return this;
  }

  async fetch():Promise<UrlStreamInfo>{
    return {
      type: "url",
      url: this.Url
    };
  }

  toField(){
    return [{
      name: ":link:URL",
      value: this.Url
    }, {
      name: ":asterisk:詳細",
      value: "カスタムストリーム"
    }] as EmbedField[];
  }

  npAdditional(){return "";}

  exportData():exportableCustom{
    return {
      url: this.Url,
      length: this._lengthSeconds
    };
  }

  private extractFilename(){
    const paths = this.Url.split("/");
    return paths[paths.length - 1];
  }
}

export type exportableCustom = {
  url: string,
  length: number,
};
