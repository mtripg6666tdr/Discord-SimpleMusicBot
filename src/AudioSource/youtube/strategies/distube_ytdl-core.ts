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

import type { Cache, StrategyFetchResult } from "./base";
import type { ReadableStreamInfo, StreamInfo, UrlStreamInfo } from "../../audiosource";
import type { Readable } from "stream";

import * as ytdl from "@distube/ytdl-core";

import { Strategy } from "./base";
import { YouTubeJsonFormat } from "..";
import { unsafeTraverseFrom } from "../../../Util";
import { getConfig } from "../../../config";
import { SecondaryUserAgent } from "../../../definition";
import { createChunkedDistubeYTStream, createRefreshableYTLiveStream } from "../stream";

export type distubeYtdlCore = "distubeYtdlCore";
export const distubeYtdlCore: distubeYtdlCore = "distubeYtdlCore";

const config = getConfig();

type distubeYtdlCoreCache = Cache<distubeYtdlCore, ytdl.videoInfo>;

const poTokenExperiments = ["51217476", "51217102"];

export class distubeYtdlCoreStrategy extends Strategy<distubeYtdlCoreCache, ytdl.videoInfo> {
  protected agent = config.proxy ? ytdl.createProxyAgent({ uri: config.proxy }) : undefined;

  get cacheType(){
    return distubeYtdlCore;
  }

  async getInfo(url: string){
    this.logStrategyUsed();

    const info = await ytdl.getInfo(url, {
      lang: "ja",
      agent: this.agent,
    });

    const nop = this.validateInfoExperiments(info);

    if(!nop){
      throw new Error("Detected broken formats.");
    }

    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: distubeYtdlCore,
        data: info,
      },
    };
  }

  async fetch(url: string, forceurl: true, cache?: Cache<any, any>): Promise<StrategyFetchResult<distubeYtdlCoreCache, UrlStreamInfo>>;
  async fetch(url: string, forceurl?: boolean, cache?: Cache<any, any>): Promise<StrategyFetchResult<distubeYtdlCoreCache, StreamInfo>>;
  async fetch(url: string, forceUrl: boolean = false, cache?: Cache<any, any>): Promise<StrategyFetchResult<distubeYtdlCoreCache, StreamInfo>> {
    this.logStrategyUsed();

    const availableCache = this.cacheIsValid(cache) && this.validateCacheExperiments(cache) && cache.data;

    this.logger.info(availableCache ? "using cache without obtaining" : "obtaining info");

    let info: ytdl.videoInfo = null!;

    for(let i = 0; i < 3; i++){
      info = availableCache || await ytdl.getInfo(url, {
        lang: config.defaultLanguage,
      });

      if(this.validateInfoExperiments(info)) break;

      unsafeTraverseFrom(ytdl)
        .getProperty("cache")
        .select(obj => Object.values<Map<string, any>>(obj))
        .execute("forEach")(s => s.clear());
    }

    if(!this.validateInfoExperiments(info)){
      throw new Error("Detected broken formats.");
    }

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
          type: distubeYtdlCore,
          data: info,
        },
      };
    }else{
      const readable: Readable = info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow
        ? createRefreshableYTLiveStream(info, url, { format, lang: config.defaultLanguage })
        : createChunkedDistubeYTStream(info, format, { lang: config.defaultLanguage }, 512 * 1024);

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
          type: distubeYtdlCore,
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

  protected override cacheIsValid(cache?: Cache<any, any> | undefined): cache is Cache<distubeYtdlCore, ytdl.videoInfo> {
    return cache?.type === distubeYtdlCore;
  }

  extractExperiments(info: ytdl.videoInfo): string[] {
    // ref: https://github.com/yt-dlp/yt-dlp/pull/10456/files
    const experiments = unsafeTraverseFrom(info)
      .getProperty("response")
      .getProperty("responseContext")
      .getProperty("serviceTrackingParams")
      .select(v => v.find((d: any) => d.service === "GFEEDBACK"))
      .getProperty("params")
      .select(v => v.find((d: any) => d.key === "e"))
      .getProperty("value")
      .select<string[]>(v => v.split(","))
      .value;

    return experiments || [];
  }

  validateInfoExperiments(info: ytdl.videoInfo){
    const experiments = this.extractExperiments(info);

    this.logger.trace("Experiments", experiments.join(", "));

    return !poTokenExperiments.some(expId => experiments.includes(expId));
  }

  validateCacheExperiments(cache: Cache<distubeYtdlCore, ytdl.videoInfo>){
    return this.validateInfoExperiments(cache.data);
  }
}

export default distubeYtdlCoreStrategy;
