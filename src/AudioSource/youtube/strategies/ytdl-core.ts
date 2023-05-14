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

import type { Cache } from "./base";
import type { ReadableStreamInfo, UrlStreamInfo } from "../../audiosource";
import type { Readable } from "stream";

import { HttpsProxyAgent } from "https-proxy-agent";
import * as ytdl from "ytdl-core";

import { Strategy } from "./base";
import { useConfig } from "../../../config";
import { SecondaryUserAgent } from "../../../definition";
import { createChunkedYTStream, createRefreshableYTLiveStream } from "../stream";

type ytdlCore = "ytdlCore";
export const ytdlCore: ytdlCore = "ytdlCore";

const config = useConfig();

export class ytdlCoreStrategy extends Strategy<Cache<ytdlCore, ytdl.videoInfo>, ytdl.videoInfo> {
  protected agent = config.proxy ? new HttpsProxyAgent(config.proxy) : undefined;

  get cacheType(){
    return ytdlCore;
  }

  async getInfo(url: string){
    this.logStrategyUsed();
    const requestOptions = this.agent ? { agent: this.agent } : undefined;
    let info = null as ytdl.videoInfo;
    info = await ytdl.getInfo(url, {
      lang: "ja",
      requestOptions,
    });
    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: ytdlCore,
        data: info,
      },
    };
  }

  async fetch(url: string, forceUrl: boolean = false, cache?: Cache<any, any>){
    this.logStrategyUsed();
    const info = await (async () => {
      if(cache && cache.type === "ytdlCore"){
        this.logger.info("using cache without obtaining");
        return cache.data as ytdl.videoInfo;
      }else{
        this.logger.info("obtaining info");
        const requestOptions = this.agent ? { agent: this.agent } : undefined;
        // eslint-disable-next-line @typescript-eslint/no-shadow
        let info = null as ytdl.videoInfo;
        info = await ytdl.getInfo(url, {
          lang: "ja",
          requestOptions,
        });
        return info;
      }
    })();
    const format = ytdl.chooseFormat(info.formats, info.videoDetails.liveBroadcastDetails?.isLiveNow ? {
      filter: null,
      quality: null,
      isHLS: false,
    } as ytdl.chooseFormatOptions : {
      filter: "audioonly",
      quality: "highestaudio",
    });
    this.logger.info(`format: ${format.itag}, bitrate: ${format.bitrate}bps, audio codec:${format.audioCodec}, container: ${format.container}`);
    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: info.related_videos.map(video => ({
        url: "https://www.youtube.com/watch?v=" + video.id,
        title: video.title,
        description: "No description due to being fetched via related-videos.",
        length: video.length_seconds,
        channel: (video.author as ytdl.Author)?.name,
        channelUrl: (video.author as ytdl.Author)?.channel_url,
        thumbnail: video.thumbnails[0].url,
        isLive: video.isLive,
      })).filter(v => !v.isLive),
    };
    if(forceUrl){
      return {
        ...partialResult,
        stream: {
          type: "url",
          url: format.url,
          userAgent: SecondaryUserAgent,
          streamType: format.container === "webm" && format.audioCodec === "opus"
            ? "webm/opus"
            : "unknown",
        } as UrlStreamInfo,
        cache: {
          type: ytdlCore,
          data: info,
        },
      };
    }else{
      let readable = null as Readable;
      if(info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow){
        readable = createRefreshableYTLiveStream(info, url, { format, lang: "ja" });
      }else{
        readable = createChunkedYTStream(info, format, { lang: "ja" }, 1 * 1024 * 1024);
      }
      return {
        ...partialResult,
        stream: {
          type: "readable",
          stream: readable,
          streamType:
            format.container === "webm" && format.audioCodec === "opus"
              ? "webm/opus"
              : "unknown",
        } as ReadableStreamInfo,
        cache: {
          type: ytdlCore,
          data: info,
        },
      };
    }
  }

  protected mapToExportable(url: string, info: ytdl.videoInfo){
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

export default ytdlCoreStrategy;
