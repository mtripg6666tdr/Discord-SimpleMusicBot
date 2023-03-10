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

import type { Cache } from "./strategies/base";
import type { ytdlCoreStrategy } from "./strategies/ytdl-core";
import type { StreamInfo } from "..";
import type { EmbedField } from "oceanic.js";

import * as ytdl from "ytdl-core";

import { attemptGetInfoForStrategies, attemptFetchForStrategies, strategies } from "./strategies";
import { ytdlCore } from "./strategies/ytdl-core";
import { SecondaryUserAgent } from "../../definition";
import { AudioSource } from "../audiosource";

export * from "./spawner";

export class YouTube extends AudioSource<string> {
  // サービス識別子（固定）
  protected cache: Cache<any, any> = null;
  protected channelName: string;
  protected channelUrl: string;
  protected upcomingTimestamp: string = null;

  protected _fallback = false;
  get fallback(){
    return this._fallback;
  }
  protected set fallback(value: boolean){
    this._fallback = value;
  }

  protected _isLiveStream: boolean;
  get isLiveStream(){
    return this._isLiveStream;
  }
  protected set isLiveStream(value: boolean){
    this._isLiveStream = value;
  }
  
  _relatedVideos: readonly exportableYouTube[] = [];
  get relatedVideos(): readonly exportableYouTube[] {
    return this._relatedVideos;
  }
  protected set relatedVideos(value: readonly exportableYouTube[]){
    this._relatedVideos = value;
  }

  constructor(){
    super("youtube");
  }

  get IsFallbacked(){
    return this.fallback;
  }

  get IsCached(){
    return !!this.cache;
  }

  get availableAfter(){
    return this.upcomingTimestamp;
  }

  async init(url: string, prefetched: exportableYouTube, forceCache?: boolean){
    this.url = "https://www.youtube.com/watch?v=" + ytdl.getVideoID(url);
    if(prefetched){
      this.importData(prefetched);
    }else{
      const { result, resolved } = await attemptGetInfoForStrategies(url);

      // check if fallbacked
      this.fallback = resolved !== 0;

      // check if upcoming
      const videoDetails = "videoDetails" in result.cache.data && result.cache.data.videoDetails;
      if(
        videoDetails
        && videoDetails.liveBroadcastDetails
        && videoDetails.liveBroadcastDetails.startTimestamp
        && !videoDetails.liveBroadcastDetails.isLiveNow
        && !videoDetails.liveBroadcastDetails.endTimestamp
      ){
        this.upcomingTimestamp = videoDetails.liveBroadcastDetails.startTimestamp;
      }else{
        this.upcomingTimestamp = null;
      }

      // store data as cache if requested
      if(forceCache) this.cache = result.cache;

      // import data to the current instance
      this.importData(result.data);
    }
    return this;
  }

  async fetch(forceUrl?: boolean): Promise<StreamInfo>{
    const { result, resolved } = await attemptFetchForStrategies(this.url, forceUrl, this.cache);
    this.fallback = resolved !== 0;
    // store related videos
    this.relatedVideos = result.relatedVideos;
    this.importData(result.info);
    if(forceUrl){
      this.logger.info("Returning a url instead of stream");
    }
    return result.stream;
  }

  async fetchVideo(){
    let info = this.cache?.type === ytdlCore && this.cache.data as ytdl.videoInfo || null;
    if(!info) info = await (strategies[0] as ytdlCoreStrategy).getInfo(this.url).then(result => (this.cache = result.cache).data);
    const isLive = info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow;
    const format = ytdl.chooseFormat(info.formats, {
      quality: isLive ? null : "highestvideo",
      isHLS: isLive,
    } as ytdl.chooseFormatOptions);
    const { url } = format;
    return {
      url,
      ua: SecondaryUserAgent,
    };
  }

  toField(verbose: boolean = false){
    const fields = [] as EmbedField[];
    fields.push({
      name: ":cinema:チャンネル名",
      value: this.channelUrl ? `[${this.channelName}](${this.channelUrl})` : this.channelName,
      inline: false,
    }, {
      name: ":asterisk:概要",
      value: this.description.length > (verbose ? 1000 : 350) ? this.description.substring(0, verbose ? 1000 : 300) + "..." : this.description || "*概要欄なし*",
      inline: false,
    });
    return fields;
  }

  npAdditional(){
    return "\r\nチャンネル名:`" + this.channelName + "`";
  }

  exportData(): exportableYouTube{
    return {
      url: this.url,
      title: this.title,
      description: this.description,
      length: this.lengthSeconds,
      channel: this.channelName,
      channelUrl: this.channelUrl,
      thumbnail: this.thumbnail,
      isLive: this.isLiveStream,
    };
  }

  private importData(exportable: exportableYouTube){
    this.title = exportable.title;
    this.description = exportable.description || "";
    this.lengthSeconds = exportable.isLive ? NaN : exportable.length;
    this.channelName = exportable.channel;
    this.channelUrl = exportable.channelUrl;
    this.thumbnail = exportable.thumbnail;
    this.isLiveStream = exportable.isLive;
  }

  disableCache(){
    this.cache = null;
  }

  waitForLive(signal: AbortSignal, tick: () => void){
    if(!this.availableAfter){
      throw new Error("This is not a live stream");
    }

    return new Promise<void>(resolve => {
      let timeout: NodeJS.Timeout = null;
      signal.addEventListener("abort", () => {
        if(timeout){
          clearTimeout(timeout);
          resolve();
        }
      }, { once: true });
      const checkForLive = () => {
        if(signal.aborted) return;
        tick();
        const startTime = this.availableAfter;
        if(!startTime) resolve();
        const waitTime = Math.max(new Date(startTime).getTime() - Date.now(), 20 * 1000);
        this.logger.info(`Retrying after ${waitTime}ms`);
        timeout = setTimeout(async () => {
          if(signal.aborted) return;
          tick();
          this.disableCache();
          await this.init(this.url, null);
          checkForLive();
        }, waitTime).unref();
      };
      checkForLive();
    });
  }
}

export type exportableYouTube = {
  url: string,
  title: string,
  description: string,
  length: number,
  channel: string,
  channelUrl: string,
  thumbnail: string,
  isLive: boolean,
};
