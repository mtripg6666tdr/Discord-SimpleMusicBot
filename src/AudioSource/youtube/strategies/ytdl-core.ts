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

export type ytdlCore = "ytdlCore";
export const ytdlCore: ytdlCore = "ytdlCore";

type ytdlCoreCache = Cache<ytdlCore, VideoInfo>;

export class ytdlCoreStrategy extends Strategy<ytdlCoreCache, VideoInfo> {
  get cacheType() {
    return ytdlCore;
  }

  async getInfo(url: string) {
    this.logStrategyUsed();

    const info = await getYtdlInfo(url);
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

    const info = availableCache || await getYtdlInfo(url);

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
          type: ytdlCore,
          data: info,
        },
      };
    } else {
      const readable: Readable = isLiveNow
        ? createRefreshableYTLiveStream(info, url, format)
        : createChunkedDistubeYTStream(info, format, 1 * 1024 * 1024);

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

  protected override cacheIsValid(cache?: Cache<any, any> | undefined): cache is Cache<ytdlCore, VideoInfo> {
    return cache?.type === ytdlCore;
  }
}

export default ytdlCoreStrategy;
