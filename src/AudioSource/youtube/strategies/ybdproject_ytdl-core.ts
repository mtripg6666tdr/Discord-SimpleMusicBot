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

import { Readable } from "stream";

import * as ytdl from "@ybd-project/ytdl-core";
import { safeTraverse } from "safe-traverse";
import { fetch, ProxyAgent } from "undici";

import { Strategy } from "./base";
import { YouTubeJsonFormat } from "..";
import { getConfig } from "../../../config";
import { SecondaryUserAgent } from "../../../definition";

export type ybdProjectYtdlCore = "distubeYtdlCore";
export const ybdProjectYtdlCore: ybdProjectYtdlCore = "distubeYtdlCore";

const config = getConfig();

type distubeYtdlCoreCache = Cache<ybdProjectYtdlCore, ytdl.YTDL_VideoInfo>;

const poTokenExperiments = ["51217476", "51217102"];

export class ybdProjectYtdlCoreStrategy extends Strategy<distubeYtdlCoreCache, ytdl.YTDL_VideoInfo> {
  protected agent = config.proxy ? new ProxyAgent(config.proxy) : undefined;
  protected ytClient = new ytdl.YtdlCore({
    // @ts-expect-error
    fetcher:
    (url, options) => fetch(url, { ...options, dispatcher: this.agent }),
  });

  get cacheType() {
    return ybdProjectYtdlCore;
  }

  async getInfo(url: string) {
    this.logStrategyUsed();

    const info = await this.ytClient.getFullInfo(url, {
      hl: "ja",
    });

    const nop = this.validateInfoExperiments(info);

    if (!nop) {
      throw new Error("Detected broken formats.");
    }

    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: ybdProjectYtdlCore,
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

    let info: ytdl.YTDL_VideoInfo = null!;

    for (let i = 0; i < 3; i++) {
      info = availableCache || await this.ytClient.getFullInfo(url, {
        hl: config.defaultLanguage as ytdl.YTDL_Hreflang,
      });

      if (this.validateInfoExperiments(info)) break;

      safeTraverse(ytdl)
        .get("cache")
        .values()
        .call("clear", (s: Map<string, any>) => s.clear());
    }

    if (!this.validateInfoExperiments(info)) {
      throw new Error("Detected broken formats.");
    }

    const format = ytdl.default.chooseFormat(info.formats, info.videoDetails.liveBroadcastDetails?.isLiveNow ? {
      filter: undefined,
      quality: undefined,
      isHLS: false,
    } as ytdl.YTDL_ChooseFormatOptions : {
      filter: "audioonly",
      quality: "highestaudio",
    });

    this.logger.info(`format: ${format.itag}, bitrate: ${format.bitrate}bps, audio codec:${format.codec.audio}, container: ${format.container}`);

    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: info.relatedVideos.filter(v => !v.isLive).map(video => ({
        url: `https://www.youtube.com/watch?v=${video.id}`,
        title: video.title,
        description: "No description due to being fetched via related-videos.",
        length: video.lengthSeconds,
        channel: video.author.name,
        channelUrl: video.author.channelUrl,
        thumbnail: video.thumbnails[0].url,
        isLive: video.isLive,
      }) as YouTubeJsonFormat),
    };

    if (forceUrl) {
      return {
        ...partialResult,
        stream: {
          type: "url",
          url: format.url,
          userAgent: SecondaryUserAgent,
          streamType: format.container === "webm" && format.codec.audio === "opus"
            ? "webm/opus"
            : "unknown",
        } as UrlStreamInfo,
        cache: null!,
      };
    } else {
      // TODO: create refreshable live stream
      // const readable: Readable = info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow
      //   ? createRefreshableYTLiveStream(info, url, { format, lang: config.defaultLanguage })
      //   : createChunkedDistubeYTStream(info, format, { lang: config.defaultLanguage });
      const readableStream = await this.ytClient.downloadFromInfo(info, { format, hl: config.defaultLanguage as ytdl.YTDL_Hreflang });
      const reader = readableStream.getReader();
      const readable = new Readable({
        async read() {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(value);
          }
        },
      });

      return {
        ...partialResult,
        stream: {
          type: "readable",
          stream: readable,
          streamType:
            format.container === "webm" && format.codec.audio === "opus"
              ? "webm/opus"
              : "unknown",
        } as ReadableStreamInfo,
        cache: null!,
      };
    }
  }

  protected mapToExportable(url: string, info: ytdl.YTDL_VideoInfo) {
    return {
      url,
      title: info.videoDetails.title,
      description: info.videoDetails.description || "",
      length: Number(info.videoDetails.lengthSeconds),
      channel: info.videoDetails.author?.name || "",
      channelUrl: info.videoDetails.author?.channelUrl || "",
      thumbnail: info.videoDetails.thumbnails[0].url,
      isLive: !!(info.videoDetails.isLiveContent && info.videoDetails.liveBroadcastDetails?.isLiveNow),
    };
  }

  protected override cacheIsValid(cache?: Cache<any, any> | undefined): cache is Cache<ybdProjectYtdlCore, ytdl.YTDL_VideoInfo> {
    return cache?.type === ybdProjectYtdlCore;
  }

  extractExperiments(info: ytdl.YTDL_VideoInfo): string[] {
    // ref: https://github.com/yt-dlp/yt-dlp/pull/10456/files

    const experiments = safeTraverse(info)
      .expect(_ => _.response.responseContext.serviceTrackingParams)
      .validate(_ => !!_.find)
      .select(_ => _.find((d: any) => d.service === "GFEEDBACK"))
      .get<any>("params")
      .validate(_ => !!_.find)
      .select(_ => _.find((d: any) => d.key === "e"))
      .safeExpect(_ => _.value.split(","))
      .get() as string[];

    return experiments || [];
  }

  validateInfoExperiments(info: ytdl.YTDL_VideoInfo) {
    const experiments = this.extractExperiments(info);

    this.logger.trace("Experiments", experiments.join(", "));

    return !poTokenExperiments.some(expId => experiments.includes(expId));
  }

  validateCacheExperiments(cache: Cache<ybdProjectYtdlCore, ytdl.YTDL_VideoInfo>) {
    return this.validateInfoExperiments(cache.data);
  }
}

export default ybdProjectYtdlCoreStrategy;
