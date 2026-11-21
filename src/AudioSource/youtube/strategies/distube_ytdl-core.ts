/*
 * Copyright 2021-2025 mtripg6666tdr
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

import type { YouTubeJsonFormat } from "..";
import type { Cache, StrategyFetchResult } from "./base";
import type { ReadableStreamInfo, StreamInfo, UrlStreamInfo } from "../../audiosource";
import type { VideoInfo } from "../ytdlCore";
import type { Readable } from "stream";

import { Strategy } from "./base";
import { SecondaryUserAgent } from "../../../definition";
import { createChunkedDistubeYTStream, createRefreshableYTLiveStream } from "../stream";
import { getInfo as getYtdlInfo, loadYtdlCore } from "../ytdlCore";

export type distubeYtdlCore = "distubeYtdlCore";
export const distubeYtdlCore: distubeYtdlCore = "distubeYtdlCore";

type distubeYtdlCoreCache = Cache<distubeYtdlCore, VideoInfo>;

const poTokenExperiments = ["51217476", "51217102"];

export class distubeYtdlCoreStrategy extends Strategy<distubeYtdlCoreCache, VideoInfo> {
  get cacheType() {
    return distubeYtdlCore;
  }

  async getInfo(url: string) {
    this.logStrategyUsed();

    const info = await getYtdlInfo(url);

    const nop = this.validateInfoExperiments(info);

    if (!nop) {
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

    let info: VideoInfo = null!;

    for (let i = 0; i < 3; i++) {
      info = availableCache || await getYtdlInfo(url);

      if (this.validateInfoExperiments(info)) break;

      this.logger.warn("Detected broken formats; retrying...");
      // Note: @distube/ytdl-core v5 does not expose its internal caches,
      // so the signature-cache reset the v4-based implementation did here
      // can no longer be performed.
    }

    if (!this.validateInfoExperiments(info)) {
      throw new Error("Detected broken formats.");
    }

    const isLiveNow = !!(info.videoDetails.isLive && !info.videoDetails.isUpcoming);
    const { chooseFormat, Quality } = await loadYtdlCore();
    const format = chooseFormat(info.formats, isLiveNow
      ? {
        // For live streams, always pick an HLS format that carries audio.
        // ytdl-core v5's chooseFormat defaults to the highest total bitrate,
        // which would otherwise select a video-only format (e.g. itag 137).
        filter: (f) => f.hasAudio && f.isHLS,
      }
      : {
        filter: { hasAudio: true, hasVideo: false },
        quality: Quality.HighestAudio,
      });

    this.logger.info(`format: ${format.itag}, bitrate: ${format.bitrate}bps, audio codec:${format.audioCodec}, container: ${format.container}`);

    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: info.relatedVideos.filter(v => !v.isLive).map(video => ({
        url: `https://www.youtube.com/watch?v=${video.id}`,
        title: video.title,
        description: "No description due to being fetched via related-videos.",
        length: video.lengthSeconds ?? 0,
        channel: video.author.name || "",
        channelUrl: video.author.url || "",
        thumbnail: video.thumbnails[0]?.url || "",
        isLive: video.isLive,
      }) as YouTubeJsonFormat),
    };

    if (forceUrl) {
      if (!format.url) {
        throw new Error("No direct URL is available for the chosen format.");
      }

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
    } else {
      const readable: Readable = isLiveNow
        ? createRefreshableYTLiveStream(info, url, format)
        : createChunkedDistubeYTStream(info, format);

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

  protected mapToExportable(url: string, info: VideoInfo) {
    return {
      url,
      title: info.videoDetails.title,
      description: info.videoDetails.description || "",
      length: info.videoDetails.lengthSeconds,
      channel: info.videoDetails.author.name,
      channelUrl: info.videoDetails.author.url,
      thumbnail: info.videoDetails.thumbnails[0]?.url || "",
      isLive: !!(info.videoDetails.isLive && !info.videoDetails.isUpcoming),
    };
  }

  protected override cacheIsValid(cache?: Cache<any, any> | undefined): cache is Cache<distubeYtdlCore, VideoInfo> {
    return cache?.type === distubeYtdlCore;
  }

  extractExperiments(info: VideoInfo): string[] {
    // ref: https://github.com/yt-dlp/yt-dlp/pull/10456/files

    const trackingParams = (info.playerResponse as any)
      ?.responseContext?.serviceTrackingParams;
    const gfeedback = Array.isArray(trackingParams)
      ? trackingParams.find((d: any) => d.service === "GFEEDBACK")
      : undefined;
    const experimentsParam = Array.isArray(gfeedback?.params)
      ? gfeedback.params.find((d: any) => d.key === "e")
      : undefined;

    return typeof experimentsParam?.value === "string" ? experimentsParam.value.split(",") : [];
  }

  validateInfoExperiments(info: VideoInfo) {
    const experiments = this.extractExperiments(info);

    // this.logger.trace("Experiments", experiments.join(", "));

    return !poTokenExperiments.some(expId => experiments.includes(expId));
  }

  validateCacheExperiments(cache: Cache<distubeYtdlCore, VideoInfo>) {
    return this.validateInfoExperiments(cache.data);
  }
}

export default distubeYtdlCoreStrategy;
