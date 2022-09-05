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

import type { ReadableStreamInfo, UrlStreamInfo } from "../../audiosource";
import type { Cache } from "./base";
import type { Readable } from "stream";

import * as HttpsProxyAgent from "https-proxy-agent";
import * as ytdl from "ytdl-core";

import Util from "../../../Util";
import { SecondaryUserAgent } from "../../../Util/ua";
import { createChunkedYTStream } from "../stream";
import { Strategy } from "./base";

const ua = SecondaryUserAgent;

type ytdlCore = "ytdlCore";
export const ytdlCore:ytdlCore = "ytdlCore";

export class ytdlCoreStrategy extends Strategy<Cache<ytdlCore, ytdl.videoInfo>, ytdl.videoInfo> {
  get cacheType(){
    return ytdlCore;
  }

  async getInfo(url:string){
    this.useLog();
    const agent = Util.config.proxy && HttpsProxyAgent.default(Util.config.proxy);
    const requestOptions = agent ? {agent} : undefined;
    const t = Util.time.timer.start(`YouTube(Strategy#${this.priority})#getInfo`);
    let info = null as ytdl.videoInfo;
    try{
      info = await ytdl.getInfo(url, {
        lang: "ja",
        requestOptions,
      });
    }
    finally{
      t.end(this.logger);
    }
    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: ytdlCore,
        data: info,
      }
    };
  }

  async fetch(url:string, forceUrl:boolean = false, cache?: Cache<any, any>){
    this.useLog();
    const info = await (async () => {
      if(cache && cache.type === "ytdlCore"){
        this.logger("[AudioSource:youtube] using cache without obtaining");
        return cache.data as ytdl.videoInfo;
      }else{
        this.logger("[AudioSource:youtube] obtaining info");
        const agent = Util.config.proxy && HttpsProxyAgent.default(Util.config.proxy);
        const requestOptions = agent ? {agent} : undefined;
        const t = Util.time.timer.start(`YouTube(Strategy#${this.priority})#fetch`);
        // eslint-disable-next-line @typescript-eslint/no-shadow
        let info = null as ytdl.videoInfo;
        try{
          info = await ytdl.getInfo(url, {
            lang: "ja",
            requestOptions,
          });
        }
        finally{
          t.end(this.logger);
        }
        return info;
      }
    })();
    const format = ytdl.chooseFormat(info.formats, info.videoDetails.liveBroadcastDetails?.isLiveNow ? {
      filter: null,
      quality: null,
      isHLS: false
    } as ytdl.chooseFormatOptions : {
      filter: "audioonly",
      quality: "highestaudio",
    });
    this.logger(`[AudioSource:youtube]Format: ${format.itag}, Bitrate: ${format.bitrate}bps, Audio codec:${format.audioCodec}, Container: ${format.container}`);
    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: info.related_videos.map(video => ({
        url: "https://www.youtube.com/watch?v=" + video.id,
        title: video.title,
        description: "関連動画として取得したため詳細は表示されません",
        length: video.length_seconds,
        channel: (video.author as ytdl.Author)?.name,
        channelUrl: (video.author as ytdl.Author)?.channel_url,
        thumbnail: video.thumbnails[0].url,
        isLive: video.isLive
      })).filter(v => !v.isLive),
    };
    if(forceUrl){
      return {
        ...partialResult,
        stream: {
          type: "url",
          url: format.url,
          userAgent: ua,
        } as UrlStreamInfo
      };
    }else{
      let readable = null as Readable;
      if(info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow){
        readable = ytdl.downloadFromInfo(info, {format, lang: "ja"});
      }else{
        readable = createChunkedYTStream(info, format, {lang: "ja"}, 1 * 1024 * 1024);
      }
      return {
        ...partialResult,
        stream: {
          type: "readable",
          stream: readable,
          streamType: format.container === "webm" && format.audioCodec === "opus" ? "webm" : undefined
        } as ReadableStreamInfo
      };
    }
  }

  protected mapToExportable(url:string, info:ytdl.videoInfo){
    if(!info.videoDetails.isLiveContent && info.videoDetails.liveBroadcastDetails && !info.videoDetails.liveBroadcastDetails.isLiveNow && info.videoDetails.liveBroadcastDetails.startTimestamp && !info.videoDetails.liveBroadcastDetails.endTimestamp){
      throw new Error("This video is still in upcoming");
    }
    return {
      url,
      title: info.videoDetails.title,
      description: info.videoDetails.description,
      length: Number(info.videoDetails.lengthSeconds),
      channel: info.videoDetails.ownerChannelName,
      channelUrl: info.videoDetails.author.channel_url,
      thumbnail: info.videoDetails.thumbnails[0].url,
      isLive: !!(info.videoDetails.isLiveContent && info.videoDetails.liveBroadcastDetails?.isLiveNow),
    };
  }
}
