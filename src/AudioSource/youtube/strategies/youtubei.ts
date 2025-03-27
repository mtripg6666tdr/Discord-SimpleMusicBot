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

import type { Cache, StrategyFetchResult } from "./base";
import type { ReadableStreamInfo, StreamInfo, UrlStreamInfo } from "../../audiosource";
import type { Readable } from "stream";
import type { YT } from "youtubei.js";

import path from "path";

import { getURLVideoID } from "@distube/ytdl-core";
import { Innertube, UniversalCache, YTNodes } from "youtubei.js";

import { type YouTubeJsonFormat } from "..";
import { Strategy } from "./base";
import { createFragmentalDownloadStream } from "../../../Util";
import { getConfig } from "../../../config";
import { DefaultAudioThumbnailURL, SecondaryUserAgent } from "../../../definition";
import { getTrustedSession } from "../session";
export type youtubei = "youtubei";
export const youtubei: youtubei = "youtubei";

const config = getConfig();

type youtubeiCache = Cache<youtubei, YT.VideoInfo>;

export class youtubeiStrategy extends Strategy<youtubeiCache, YT.VideoInfo> {
  protected _client: Innertube | null = null;

  get cacheType() {
    return youtubei;
  }

  async getClient() {
    if (this._client) {
      return this._client;
    }

    const trustedSession = await getTrustedSession();

    this._client = await Innertube.create({
      lang: config.defaultLanguage,
      location: config.defaultLanguage,
      visitor_data: trustedSession.visitor_data,
      po_token: trustedSession.potoken,
      cache: new UniversalCache(config.cacheLevel !== "memory", path.join(__dirname, "../../../../cache")),
    });

    return this._client;
  }

  async getInfo(url: string) {
    this.logStrategyUsed();

    const client = await this.getClient();
    const info = await client.getInfo(getURLVideoID(url));

    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: youtubei,
        data: info,
      },
    };
  }

  async fetch(url: string, forceurl: true, cache?: Cache<any, any>): Promise<StrategyFetchResult<youtubeiCache, UrlStreamInfo>>;
  async fetch(url: string, forceurl?: boolean, cache?: Cache<any, any>): Promise<StrategyFetchResult<youtubeiCache, StreamInfo>>;
  async fetch(url: string, forceUrl: boolean = false, cache?: Cache<any, any>): Promise<StrategyFetchResult<youtubeiCache, StreamInfo>> {
    this.logStrategyUsed();

    const availableCache = this.cacheIsValid(cache) && cache.data;

    this.logger.info(availableCache ? "using cache without obtaining" : "obtaining info");

    const client = await this.getClient();
    const info = availableCache || await client.getInfo(getURLVideoID(url));

    const format = info.basic_info.is_live
      ? info.streaming_data?.adaptive_formats.filter(f => f.has_audio)[0]
      : info.chooseFormat({
        quality: "best",
        type: "audio",
      });

    if (!format) {
      throw new Error("No format found!");
    }

    const isWebmOpus = format.mime_type === "audio/webm; codecs=\"opus\"";

    this.logger.info(`format: ${format.itag}, bitrate: ${format.bitrate}bps, mime: ${format.mime_type}`);

    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: info.watch_next_feed?.filter(v => v.is(YTNodes.CompactVideo)).map(video => ({
        url: `https://www.youtube.com/watch?v=${video.video_id}`,
        title: video.title.text,
        description: "No description due to being fetched via related-videos.",
        length: video.length_text?.text?.split(":").reduce((prev, current) => prev * 60 + Number(current), 0) || 0,
        channel: video.author.name,
        channelUrl: video.author.url,
        thumbnail: video.thumbnails[0].url,
        isLive: video.is_live,
      }) as YouTubeJsonFormat) || [],
    };

    if (forceUrl || info.basic_info.is_live) {
      return {
        ...partialResult,
        stream: {
          type: "url",
          url: info.basic_info.is_live ? info.streaming_data?.hls_manifest_url : format.decipher(client.session.player),
          userAgent: client.session.user_agent || SecondaryUserAgent,
          streamType: info.basic_info.is_live ? "m3u8" : isWebmOpus ? "webm/opus" : "unknown",
        } as UrlStreamInfo,
        cache: {
          type: youtubei,
          data: info,
        },
      };
    } else {
      const readable: Readable = createFragmentalDownloadStream(format.decipher(client.session.player), {
        chunkSize: 8 * 1024 * 1024,
        contentLength: Number(format.content_length),
        pulseDownload: true,
      });

      return {
        ...partialResult,
        stream: {
          type: "readable",
          stream: readable,
          streamType:
            isWebmOpus ? "webm/opus" : "unknown",
        } as ReadableStreamInfo,
        cache: {
          type: youtubei,
          data: info,
        },
      };
    }
  }

  protected mapToExportable(url: string, info: YT.VideoInfo) {
    return {
      url,
      title: info.basic_info.title || "unknown",
      description: info.basic_info.short_description || "",
      length: Number(info.basic_info.duration),
      channel: info.basic_info.author || "",
      channelUrl: info.basic_info.channel?.url || "",
      thumbnail: info.basic_info.thumbnail?.[0].url || DefaultAudioThumbnailURL,
      isLive: !!info.basic_info.is_live,
    };
  }

  protected override cacheIsValid(cache?: Cache<any, any> | undefined): cache is Cache<youtubei, YT.VideoInfo> {
    return cache?.type === youtubei;
  }
}

export default youtubeiStrategy;
