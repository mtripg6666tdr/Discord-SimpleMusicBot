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
import type { EmbedField } from "eris";

import candyget from "candyget";
import * as htmlEntities from "html-entities";

import { AudioSource } from "./audiosource";
import { RetriveLengthSeconds } from "../Util/web";
import { DefaultAudioThumbnailURL } from "../definition";

export class Twitter extends AudioSource {
  protected _lengthSeconds = 0;
  protected readonly _serviceIdentifer = "twitter";
  Thumbnail = DefaultAudioThumbnailURL;
  private streamUrl = "";

  async init(url: string, prefetched?: exportableTwitter){
    this.Url = url;
    if(!Twitter.validateUrl(url)) throw new Error("Invalid streamable url");
    if(prefetched){
      this._lengthSeconds = prefetched.length;
      this.Title = prefetched.title;
      this.streamUrl = prefetched.streamUrl;
    }else{
      const streamInfo = await twitterDl(url.split("?")[0]);

      try{
        this._lengthSeconds = await RetriveLengthSeconds(streamInfo.videoUrl);
      }
      catch{
        /* empty */
      }

      this.Title = `${streamInfo.displayName}(@${streamInfo.screenName})のツイート`;
      this.streamUrl = streamInfo.videoUrl;
      this.Description = streamInfo.content;
    }
    return this;
  }

  async fetch(): Promise<UrlStreamInfo>{
    return {
      type: "url",
      url: this.streamUrl
    };
  }

  toField(){
    return [{
      name: ":link:URL",
      value: this.Url
    }, {
      name: "ツイートの内容",
      value: this.Description.substring(0, 1950),
    }, {
      name: ":asterisk:詳細",
      value: "Twitterにて共有されたファイル"
    }] as EmbedField[];
  }

  npAdditional(){return "";}

  exportData(): exportableTwitter{
    return {
      url: this.Url,
      length: this.LengthSeconds,
      title: this.Title,
      streamUrl: this.streamUrl,
    };
  }

  static validateUrl(url: string){
    return !!url.match(/^https?:\/\/(twitter|x)\.com\/[a-zA-Z0-9_-]+\/status\/\d+(\?.+)?$/);
  }
}

export type exportableTwitter = exportableCustom & {
  streamUrl: string,
};

type Tweet = {
  displayName: string,
  screenName: string,
  content: string,
  videoUrl: string,
};

const mediaTypeRegExp = /<meta\s+property="twitter:card"\s+content="(?<type>.+?)"\/>/;
const twitterSiteRegExp = /<meta\s+property="twitter:site"\s+content="@(?<id>.+?)"\/>/;
const twitterTitleRegExp = /<meta\s+property="twitter:title"\s+content="(?<title>.+?)"\/>/;
const ogDescriptionRegExp = /<meta\s+property="og:description"\s+content="(?<content>.+?)"\/>/s;
const ogVideoRegExp = /<meta\s+property="og:video"\s+content="(?<url>.+?)"\/>/;
async function twitterDl(url: string): Promise<Tweet>{
  const result = await candyget.string(url.replace(/(twitter|x)\.com/, "fxtwitter.com"), {
    headers: Object.assign({}, candyget.defaultOptions.headers, {
      "User-Agent": "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
    }),
  });

  if(result.statusCode !== 200){
    throw new Error("An error occurred while fetching data.");
  }

  const type = mediaTypeRegExp.exec(result.body)?.groups?.type;
  if(type !== "player"){
    throw new Error("Provided URL includes no videos.");
  }

  const screenName = twitterSiteRegExp.exec(result.body)?.groups?.id;
  const displayName = (twitterTitleRegExp.exec(result.body)?.groups?.title || "")
    .replace(new RegExp(`\\(@${screenName}\\)$`), "")
    .trimEnd();
  const content = htmlEntities.decode(ogDescriptionRegExp.exec(result.body)?.groups?.content);
  const videoUrl = ogVideoRegExp.exec(result.body)?.groups?.url;

  return {
    displayName,
    screenName,
    content,
    videoUrl,
  };
}
