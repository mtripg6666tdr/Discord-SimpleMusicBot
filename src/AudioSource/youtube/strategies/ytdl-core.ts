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

import type { Cache, StrategyFetchResult } from "./base";
import type { ReadableStreamInfo, StreamInfo, UrlStreamInfo } from "../../audiosource";
import type { Readable } from "stream";

import { HttpsProxyAgent } from "https-proxy-agent";
import * as ytdl from "ytdl-core";

import { Strategy } from "./base";
import { YouTubeJsonFormat } from "..";
import { useConfig } from "../../../config";
import { SecondaryUserAgent } from "../../../definition";
import { createChunkedYTStream, createRefreshableYTLiveStream } from "../stream";

type ytdlCore = "ytdlCore";
export const ytdlCore: ytdlCore = "ytdlCore";

const config = useConfig();

type ytdlCoreCache = Cache<ytdlCore, ytdl.videoInfo>;

export class ytdlCoreStrategy extends Strategy<ytdlCoreCache, ytdl.videoInfo> {
  protected agent = config.proxy ? new HttpsProxyAgent(config.proxy) : undefined;

  get cacheType(){
    return ytdlCore;
  }

  async getInfo(url: string){
    this.logStrategyUsed();

    const requestOptions = this.agent ? { agent: this.agent } : undefined;

    const info = await ytdl.getInfo(url, {
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

  async fetch(url: string, forceurl: true, cache?: Cache<any, any>): Promise<StrategyFetchResult<ytdlCoreCache, UrlStreamInfo>>;
  async fetch(url: string, forceurl?: boolean, cache?: Cache<any, any>): Promise<StrategyFetchResult<ytdlCoreCache, StreamInfo>>;
  async fetch(url: string, forceUrl: boolean = false, cache?: Cache<any, any>): Promise<StrategyFetchResult<ytdlCoreCache, StreamInfo>> {
    this.logStrategyUsed();

    const availableCache = this.cacheIsValid(cache) && cache.data;

    this.logger.info(availableCache ? "using cache without obtaining" : "obtaining info");

    const info = availableCache || await ytdl.getInfo(url, {
      lang: config.defaultLanguage,
    });


    const format = ytdl.chooseFormat(info.formats, info.videoDetails.liveBroadcastDetails?.isLiveNow ? {
      filter: undefined,
      quality: undefined,
      isHLS: false,
    } as ytdl.chooseFormatOptions : {
      filter: "audioonly",
      quality: "highestaudio",
    });

    this.logger.info(`format: ${format.itag}, bitrate: ${format.bitrate}bps, audio codec:${format.audioCodec}, container: ${format.container}`);

    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: info.related_videos.filter(v => !v.isLive).map(video => ({
        url: `https://www.youtube.com/watch?v=${video.id}`,
        title: video.title,
        description: "No description due to being fetched via related-videos.",
        length: video.length_seconds,
        channel: (video.author as ytdl.Author)?.name,
        channelUrl: (video.author as ytdl.Author)?.channel_url,
        thumbnail: video.thumbnails[0].url,
        isLive: video.isLive,
      }) as YouTubeJsonFormat),
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
      const readable: Readable = info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow
        ? createRefreshableYTLiveStream(info, url, { format, lang: config.defaultLanguage })
        : createChunkedYTStream(info, format, { lang: config.defaultLanguage }, 1 * 1024 * 1024);

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
      description: info.videoDetails.description || "",
      length: Number(info.videoDetails.lengthSeconds),
      channel: info.videoDetails.ownerChannelName,
      channelUrl: info.videoDetails.author.channel_url,
      thumbnail: info.videoDetails.thumbnails[0].url,
      isLive: !!(info.videoDetails.isLiveContent && info.videoDetails.liveBroadcastDetails?.isLiveNow),
    };
  }

  protected override cacheIsValid(cache?: Cache<any, any> | undefined): cache is Cache<ytdlCore, ytdl.videoInfo> {
    return cache?.type === ytdlCore;
  }
}

export default ytdlCoreStrategy;
