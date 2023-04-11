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
import type { exportableYouTube } from "..";
import type { UrlStreamInfo } from "../../audiosource";
import type { InfoData } from "play-dl";

import { StreamType } from "@discordjs/voice";
import { stream_from_info } from "play-dl";
import { video_info } from "play-dl";

import { Strategy } from "./base";

type playDl = "playDl";
export const playDl: playDl = "playDl";

export class playDlStrategy extends Strategy<Cache<playDl, InfoData>, InfoData> {
  get cacheType(){
    return playDl;
  }

  async getInfo(url: string){
    this.logStrategyUsed();
    let info = null as InfoData;
    info = await video_info(url);
    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: playDl,
        data: info,
      },
    };
  }

  async fetch(url: string, forceUrl: boolean = false, cache?: Cache<any, any>){
    this.logStrategyUsed();
    let info = null as InfoData;
    const cacheAvailable = cache?.type === playDl && cache.data;
    this.logger.info(cacheAvailable ? "using cache without obtaining" : "obtaining info");
    info = cacheAvailable || await video_info(url);
    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: null as exportableYouTube[],
    };
    if(info.LiveStreamData.isLive){
      return {
        ...partialResult,
        stream: {
          type: "url",
          url: info.LiveStreamData.hlsManifestUrl,
          streamType: "m3u8",
        } as UrlStreamInfo,
        cache: {
          type: playDl,
          data: info,
        },
      };
    }else if(forceUrl){
      const format = info.format.filter(f => f.mimeType.startsWith("audio"));
      if(format.length === 0) throw new Error("no format found!");
      format.sort((fa, fb) => fb.bitrate - fa.bitrate);
      return {
        ...partialResult,
        stream: {
          type: "url" as const,
          url: format[0].url,
          streamType: (format[0] as any)["container"] === "webm" && (format[0] as any)["codec"] === "opus" ? "webm/opus" as const : undefined,
        },
        cache: {
          type: playDl,
          data: info,
        },
      };
    }else{
      const stream = await stream_from_info(info, { quality: 999, discordPlayerCompatibility: true });
      return {
        ...partialResult,
        stream: {
          type: "readable" as const,
          stream: stream.stream,
          streamType: stream.type === StreamType.WebmOpus ? "webm/opus" as const : undefined,
        },
        cache: {
          type: playDl,
          data: info,
        },
      };
    }
  }

  protected mapToExportable(url: string, info: InfoData): exportableYouTube{
    if(info.video_details.upcoming) throw new Error("This video is still in upcoming");
    return {
      url,
      title: info.video_details.title,
      description: info.video_details.description,
      length: Number(info.video_details.durationInSec),
      channel: info.video_details.channel?.name || "不明",
      channelUrl: info.video_details.channel?.url || "",
      thumbnail: info.video_details.thumbnails[0].url,
      isLive: info.video_details.live,
    };
  }
}

export default playDlStrategy;
