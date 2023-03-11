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

import type { exportableCustom, UrlStreamInfo } from ".";

import twitterDl from "twitter-url-direct";

import { AudioSource } from "./audiosource";

export class Twitter extends AudioSource<string> {
  private streamUrl = "";

  constructor(){
    super("twitter");
  }

  async init(url: string, prefetched?: exportableTwitter){
    this.url = url;
    if(!Twitter.validateUrl(url)) throw new Error("Invalid streamable url");
    if(prefetched){
      this.lengthSeconds = prefetched.length;
      this.title = prefetched.title;
      this.streamUrl = prefetched.streamUrl;
    }else{
      const streamInfo = await twitterDl(url.split("?")[0]);
      if(!streamInfo.found){
        throw new Error("error" in streamInfo && streamInfo.error);
      }

      this.lengthSeconds = Math.floor(streamInfo.duration);
      this.title = `${streamInfo.tweet_user.name}(@${streamInfo.tweet_user.username})のツイート`;
      if(!streamInfo.download){
        throw new Error("No media found");
      }
      this.streamUrl = streamInfo.download.sort((a, b) => {
        const getDimensionFactor = (dimension: string) => dimension.split("x").reduce((prev, current) => prev + Number(current), 1);
        return getDimensionFactor(b.dimension) - getDimensionFactor(a.dimension);
      })[0]?.url;
      this.description = streamInfo.tweet_user.text;

      if(!this.streamUrl){
        throw new Error("No format found");
      }
    }
    return this;
  }

  async fetch(): Promise<UrlStreamInfo>{
    return {
      type: "url",
      streamType: "mp4",
      url: this.streamUrl,
    };
  }

  toField(){
    return [
      {
        name: ":link:URL",
        value: this.url,
      }, {
        name: "ツイートの内容",
        value: this.description.substring(0, 1950),
      }, {
        name: ":asterisk:詳細",
        value: "Twitterにて共有されたファイル",
      },
    ];
  }

  npAdditional(){
    return "";
  }

  exportData(): exportableTwitter{
    return {
      url: this.url,
      length: this.lengthSeconds,
      title: this.title,
      streamUrl: this.streamUrl,
    };
  }

  static validateUrl(url: string){
    return !!url.match(/^https?:\/\/twitter\.com\/[a-zA-Z0-9_-]+\/status\/\d+(\?.+)?$/);
  }
}

export type exportableTwitter = exportableCustom & {
  streamUrl: string,
};
