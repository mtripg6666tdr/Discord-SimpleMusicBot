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

import type { StreamInfo } from "..";
import type { LoggerType } from "../../Util";
import type { Cache } from "./strategies/base";
import type { ytdlCoreStrategy } from "./strategies/ytdl-core";
import type { EmbedField } from "eris";

import * as ytdl from "ytdl-core";

import { Util } from "../../Util";
import { SecondaryUserAgent } from "../../Util/ua";
import { AudioSource } from "../audiosource";
import { attemptGetInfoForStrategies, attemptFetchForStrategies, strategies } from "./strategies";
import { ytdlCore } from "./strategies/ytdl-core";

const ua = SecondaryUserAgent;

export class YouTube extends AudioSource {
  // サービス識別子（固定）
  protected readonly _serviceIdentifer = "youtube";
  protected _lengthSeconds = 0;
  private fallback = false;
  private cache:Cache<any, any> = null;
  ChannelName:string;
  ChannelUrl:string;
  Thumnail:string;
  LiveStream:boolean;
  relatedVideos:exportableYouTube[] = [];
  logger: LoggerType;

  constructor(logger?:typeof YouTube.prototype.logger){
    super();
    this.logger = logger || Util.logger.log.bind(Util.logger);
  }

  get IsFallbacked(){
    return this.fallback;
  }

  get IsCached(){
    return !!this.cache;
  }

  async init(url:string, prefetched:exportableYouTube, forceCache?:boolean){
    this.Url = "https://www.youtube.com/watch?v=" + ytdl.getVideoID(url);
    if(prefetched){
      this.importData(prefetched);
    }else{
      const { result, resolved } = await attemptGetInfoForStrategies(this.logger, url);
      this.fallback = resolved !== 0;
      if(forceCache) this.cache = result.cache;
      this.importData(result.data);
    }
    return this;
  }

  async fetch(forceUrl?:boolean):Promise<StreamInfo>{
    const { result, resolved } = await attemptFetchForStrategies(this.logger, this.Url, forceUrl, this.cache);
    this.fallback = resolved !== 0;
    // store related videos
    this.relatedVideos = result.relatedVideos;
    this.importData(result.info);
    if(forceUrl) this.logger("[AudioSource:youtube]Returning a url instead of stream");
    return result.stream;
  }

  async fetchVideo(){
    let info = (this.cache?.type === ytdlCore && this.cache.data as ytdl.videoInfo) || null;
    if(!info) info = await (strategies[0] as ytdlCoreStrategy).getInfo(this.Url).then(result => (this.cache = result.cache).data);
    const isLive = info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow;
    const format = ytdl.chooseFormat(info.formats, {
      quality: isLive ? null : "highestvideo",
      isHLS: isLive
    } as ytdl.chooseFormatOptions);
    const { url } = format;
    return {
      url,
      ua
    };
  }

  toField(verbose:boolean = false){
    const fields = [] as EmbedField[];
    fields.push({
      name: ":cinema:チャンネル名",
      value: this.ChannelUrl ? `[${this.ChannelName}](${this.ChannelUrl})` : this.ChannelName,
      inline: false
    }, {
      name: ":asterisk:概要",
      value: this.Description.length > (verbose ? 4000 : 350) ? this.Description.substring(0, verbose ? 4000 : 300) + "..." : this.Description,
      inline: false
    });
    return fields;
  }

  npAdditional(){
    return "\r\nチャンネル名:`" + this.ChannelName + "`";
  }

  exportData():exportableYouTube{
    return {
      url: this.Url,
      title: this.Title,
      description: this.Description,
      length: this.LengthSeconds,
      channel: this.ChannelName,
      channelUrl: this.ChannelUrl,
      thumbnail: this.Thumnail,
      isLive: this.LiveStream,
    };
  }

  private importData(exportable:exportableYouTube){
    this.Title = exportable.title;
    this.Description = exportable.description;
    this._lengthSeconds = exportable.length;
    this.ChannelName = exportable.channel;
    this.ChannelUrl = exportable.channelUrl;
    this.Thumnail = exportable.thumbnail;
    this.LiveStream = exportable.isLive;
  }

  disableCache(){
    this.cache = null;
  }
}

export type exportableYouTube = {
  url:string,
  title:string,
  description:string,
  length:number,
  channel:string,
  channelUrl:string,
  thumbnail:string,
  isLive:boolean,
};
