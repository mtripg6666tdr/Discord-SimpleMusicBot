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

import type { AudioSourceBasicJsonFormat, UrlStreamInfo } from ".";

import candyget from "candyget";
import * as htmlEntities from "html-entities";

import { AudioSource } from "./audiosource";
import { getCommandExecutionContext } from "../Commands";
import { retrieveRemoteAudioInfo } from "../Util";

export class Twitter extends AudioSource<string, TwitterJsonFormat> {
  private streamUrl = "";

  async init(url: string, prefetched: TwitterJsonFormat | null){
    const { t } = getCommandExecutionContext();

    this.url = url;
    if(!Twitter.validateUrl(url)) throw new Error("Invalid Twitter url.");
    if(prefetched){
      this.lengthSeconds = prefetched.length;
      this.title = prefetched.title;
      this.streamUrl = prefetched.streamUrl;
    }else{
      const streamInfo = await twitterDl(url.split("?")[0]);
      if(!streamInfo.videoUrl){
        throw new Error("Invalid Twitter url.");
      }

      const audioInfo = await retrieveRemoteAudioInfo(streamInfo.videoUrl);
      this.lengthSeconds = audioInfo.lengthSeconds || 0;

      this.title = t("audioSources.tweet", { name: streamInfo.displayName, id: streamInfo.screenName });
      this.streamUrl = streamInfo.videoUrl;
      this.description = streamInfo.content;
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
    const { t } = getCommandExecutionContext();

    return [
      {
        name: ":link:URL",
        value: this.url,
      }, {
        name: t("audioSources.tweetContent"),
        value: this.description.substring(0, 1950),
      }, {
        name: `:asterisk:${t("moreInfo")}`,
        value: t("audioSources.fileInTwitter"),
      },
    ];
  }

  npAdditional(){
    return "";
  }

  exportData(): TwitterJsonFormat{
    return {
      url: this.url,
      length: this.lengthSeconds,
      title: this.title,
      streamUrl: this.streamUrl,
    };
  }

  static validateUrl(url: string){
    return !!url.match(/^https?:\/\/(twitter|x)\.com\/[a-zA-Z0-9_-]+\/status\/\d+(\?.+)?$/);
  }
}

export type TwitterJsonFormat = AudioSourceBasicJsonFormat & {
  streamUrl: string,
};

type Tweet = {
  displayName: string | null,
  screenName: string | null,
  content: string,
  videoUrl: string | null,
};

const mediaTypeRegExp = /<meta\s+property="twitter:card"\s+content="(?<type>.+?)"\/>/;
const twitterSiteRegExp = /<meta\s+property="twitter:site"\s+content="@(?<id>.+?)"\/>/;
const twitterTitleRegExp = /<meta\s+property="twitter:title"\s+content="(?<title>.+?)"\/>/;
const ogDescriptionRegExp = /<meta\s+property="og:description"\s+content="(?<content>.+?)"\/>/s;
const ogVideoRegExp = /<meta\s+property="og:video"\s+content="(?<url>.+?)"\/>/;
async function twitterDl(url: string): Promise<Tweet> {
  const result = await candyget.string(url.replace(/https?:\/\/(x|twitter)\.com/, "https://fxtwitter.com"), {
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

  const screenName = twitterSiteRegExp.exec(result.body)?.groups?.id || null;
  const displayName = (twitterTitleRegExp.exec(result.body)?.groups?.title || "")
    .replace(new RegExp(`\\(@${screenName}\\)$`), "")
    .trimEnd() || null;
  const content = htmlEntities.decode(ogDescriptionRegExp.exec(result.body)?.groups?.content || "");
  const videoUrl = ogVideoRegExp.exec(result.body)?.groups?.url || null;

  return {
    displayName,
    screenName,
    content,
    videoUrl,
  };
}
