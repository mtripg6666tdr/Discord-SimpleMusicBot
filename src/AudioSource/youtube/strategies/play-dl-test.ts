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
import type { YouTubeJsonFormat } from "..";
import type { InfoData } from "../../../../lib/play-dl";
import type { StreamInfo, UrlStreamInfo } from "../../audiosource";

import { StreamType } from "@discordjs/voice";

import { Strategy } from "./base";

const localRequire = require;
const { stream_from_info, video_info } = localRequire(global.BUNDLED ? "../lib/play-dl" : "../../../../lib/play-dl") as typeof import("../../../../lib/play-dl");

type playDlTest = "playDlTest";
export const playDlTest: playDlTest = "playDlTest";

export class playDlTestStrategy extends Strategy<Cache<playDlTest, InfoData>, InfoData> {
  get cacheType() {
    return playDlTest;
  }

  async getInfo(url: string) {
    this.logStrategyUsed();
    const info = await video_info(url);
    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: playDlTest,
        data: info,
      },
    };
  }

  async fetch(url: string, forceUrl: true, cache?: Cache<any, any>): Promise<StrategyFetchResult<Cache<playDlTest, InfoData>, UrlStreamInfo>>;
  async fetch(url: string, forceUrl?: boolean, cache?: Cache<any, any>): Promise<StrategyFetchResult<Cache<playDlTest, InfoData>, StreamInfo>>;
  async fetch(url: string, forceUrl: boolean = false, cache?: Cache<any, any>): Promise<StrategyFetchResult<Cache<playDlTest, InfoData>, StreamInfo>> {
    this.logStrategyUsed();

    const cacheAvailable = this.cacheIsValid(cache) && cache.data;
    this.logger.info(cacheAvailable ? "using cache without obtaining" : "obtaining info");

    const info = cacheAvailable || await video_info(url);

    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: info.related_videos,
    };

    if (info.LiveStreamData.isLive) {
      return {
        ...partialResult,
        stream: {
          type: "url",
          url: info.LiveStreamData.hlsManifestUrl,
          streamType: "m3u8",
        } as UrlStreamInfo,
        cache: {
          type: playDlTest,
          data: info,
        },
      };
    } else if (forceUrl) {
      const format = info.format.filter(f => f.mimeType?.startsWith("audio"));
      if (format.length === 0) {
        throw new Error("no format found!");
      }

      format.sort((fa, fb) => fb.bitrate! - fa.bitrate!);

      return {
        ...partialResult,
        stream: {
          type: "url" as const,
          url: format[0].url!,
          // @ts-expect-error
          streamType: format[0]["container"] === "webm" && format[0]["codec"] === "opus" ? "webm/opus" as const : null,
        },
        cache: {
          type: playDlTest,
          data: info,
        },
      };
    } else {
      const stream = await stream_from_info(info, { quality: 999, discordPlayerCompatibility: true });
      return {
        ...partialResult,
        stream: {
          type: "readable" as const,
          stream: stream.stream,
          streamType: stream.type === StreamType.WebmOpus ? "webm/opus" as const : null,
        },
        cache: {
          type: playDlTest,
          data: info,
        },
      };
    }
  }

  protected mapToExportable(url: string, info: InfoData): YouTubeJsonFormat {
    if (info.video_details.upcoming) throw new Error("This video is still in upcoming");
    return {
      url,
      title: info.video_details.title!,
      description: info.video_details.description || "",
      length: Number(info.video_details.durationInSec),
      channel: info.video_details.channel?.name || "不明",
      channelUrl: info.video_details.channel?.url || "",
      thumbnail: info.video_details.thumbnails[0].url,
      isLive: info.video_details.live,
    };
  }

  protected override cacheIsValid(cache?: Cache<any, any>): cache is Cache<playDlTest, InfoData> {
    return cache?.type === playDlTest;
  }
}

export default playDlTestStrategy;
