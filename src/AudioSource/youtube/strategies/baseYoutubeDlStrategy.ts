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
import type { BinaryManager } from "../../../Component/binaryManager";
import type { ReadableStreamInfo, StreamInfo, UrlStreamInfo } from "../../audiosource";

import { Strategy } from "./base";
import { createFragmentalDownloadStream } from "../../../Util";

export abstract class baseYoutubeDlStrategy<T extends string> extends Strategy<Cache<T, YoutubeDlInfo>, YoutubeDlInfo> {
  constructor(priority: number, protected id: T, protected binaryManager: BinaryManager){
    super(priority);
  }

  get cacheType(){
    return this.id;
  }

  last: number = 0;

  async getInfo(url: string){
    this.logStrategyUsed();

    const info = JSON.parse<YoutubeDlInfo>(await this.binaryManager.exec(["--skip-download", "--print-json", url]));

    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: this.id,
        data: info,
      },
    };
  }

  async fetch(url: string, forceUrl: true, cache?: Cache<any, any>): Promise<StrategyFetchResult<Cache<T, YoutubeDlInfo>, UrlStreamInfo>>;
  async fetch(url: string, forceUrl?: boolean, cache?: Cache<any, any>): Promise<StrategyFetchResult<Cache<T, YoutubeDlInfo>, StreamInfo>>;
  async fetch(url: string, forceUrl: boolean = false, cache?: Cache<any, any>): Promise<StrategyFetchResult<Cache<T, YoutubeDlInfo>, StreamInfo>> {
    this.logStrategyUsed();

    const availableCache = this.cacheIsValid(cache) && cache.data;
    this.logger.info(availableCache ? "using cache without obtaining" : "obtaining info");

    const info = availableCache || JSON.parse<YoutubeDlInfo>(await this.binaryManager.exec(["--skip-download", "--print-json", url]));

    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: null,
    };

    if(info.is_live){
      const format = info.formats.filter(f => f.format_id === info.format_id);

      return {
        ...partialResult,
        stream: {
          type: "url",
          url: format[0].url,
          userAgent: format[0].http_headers["User-Agent"],
        } as UrlStreamInfo,
        cache: {
          type: this.id,
          data: info,
        },
      };
    }else{
      const formats = info.formats.filter(f => f.format_note === "tiny" || f.video_ext === "none" && f.abr);

      if(formats.length === 0) throw new Error("no format found!");

      const [format] = formats.sort((fa, fb) => fb.abr! - fa.abr!);

      if(forceUrl){
        return {
          ...partialResult,
          stream: {
            type: "url",
            url: format.url,
            streamType:
              format.ext === "webm" && format.acodec === "opus"
                ? "webm/opus"
                : format.ext === "ogg" && format.acodec === "opus"
                  ? "ogg/opus"
                  : "unknown",
            userAgent: format.http_headers["User-Agent"],
          } as UrlStreamInfo,
          cache: {
            type: this.id,
            data: info,
          },
        };
      }

      return {
        ...partialResult,
        stream: {
          type: "readable",
          stream: createFragmentalDownloadStream(format.url, {
            contentLength: format.filesize,
            userAgent: format.http_headers["User-Agent"],
          }),
          streamType:
            format.ext === "webm" && format.acodec === "opus"
              ? "webm/opus"
              : format.ext === "ogg" && format.acodec === "opus"
                ? "ogg/opus"
                : "unknown",
        } as ReadableStreamInfo,
        cache: {
          type: this.id,
          data: info,
        },
      };
    }
  }

  protected mapToExportable(url: string, info: YoutubeDlInfo): YouTubeJsonFormat{
    return {
      url: url,
      title: info.title,
      description: info.description,
      length: Number(info.duration),
      channel: info.channel,
      channelUrl: info.channel_url,
      thumbnail: info.thumbnail,
      isLive: !!info.is_live,
    };
  }
}

// QuickType of youtube-dl json
export interface YoutubeDlInfo {
  id: string;
  title: string;
  formats: Format[];
  thumbnails: Thumbnail[];
  description: string;
  upload_date: string;
  uploader: string;
  uploader_id: string;
  uploader_url: string;
  channel_id: string;
  channel_url: string;
  duration: number;
  view_count: number;
  average_rating: number;
  age_limit: number;
  webpage_url: string;
  categories: string[];
  tags: string[];
  is_live: null;
  automatic_captions: { [key: string]: any[] };
  subtitles: any;
  like_count: number;
  dislike_count: number;
  channel: string;
  track: string;
  artist: string;
  album: string;
  creator: string;
  alt_title: string;
  extractor: string;
  webpage_url_basename: string;
  extractor_key: string;
  playlist: null;
  playlist_index: null;
  thumbnail: string;
  display_id: string;
  requested_subtitles: null;
  requested_formats: Format[];
  format: string;
  format_id: string;
  width: number;
  height: number;
  resolution: null;
  fps: number;
  vcodec: string;
  vbr: number;
  stretched_ratio: null;
  acodec: Acodec;
  abr: number;
  ext: TempEXT;
  fulltitle: string;
  _filename: string;
}

enum Acodec {
  Mp4A402 = "mp4a.40.2",
  None = "none",
  Opus = "opus"
}

enum TempEXT {
  M4A = "m4a",
  Mp4 = "mp4",
  Webm = "webm",
  Ogg = "ogg"
}

interface Format {
  asr: number | null;
  filesize: number;
  format_id: string;
  format_note: string;
  fps: number | null;
  height: number | null;
  quality: number;
  tbr: number;
  url: string;
  width: number | null;
  ext: TempEXT;
  vcodec: string;
  acodec: Acodec;
  abr?: number;
  downloader_options?: DownloaderOptions;
  container?: Container;
  format: string;
  protocol: Protocol;
  http_headers: HTTPHeaders;
  vbr?: number;
  video_ext?: string;
}

enum Container {
  M4ADash = "m4a_dash",
  Mp4Dash = "mp4_dash",
  WebmDash = "webm_dash"
}

interface DownloaderOptions {
  http_chunk_size: number;
}

interface HTTPHeaders {
  "User-Agent": string;
  "Accept-Charset": AcceptCharset;
  Accept: Accept;
  "Accept-Encoding": AcceptEncoding;
  "Accept-Language": AcceptLanguage;
}

enum Accept {
  TextHTMLApplicationXHTMLXMLApplicationXMLQ09Q08 = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
}

enum AcceptCharset {
  ISO88591UTF8Q07Q07 = "ISO-8859-1,utf-8;q=0.7,*;q=0.7"
}

enum AcceptEncoding {
  GzipDeflate = "gzip, deflate"
}

enum AcceptLanguage {
  EnUsEnQ05 = "en-us,en;q=0.5"
}

enum Protocol {
  HTTPS = "https"
}

interface Thumbnail {
  height: number;
  url: string;
  width: number;
  resolution: string;
  id: string;
}
