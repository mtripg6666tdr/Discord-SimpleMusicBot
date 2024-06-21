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

import type { AudioSourceBasicJsonFormat, UrlStreamInfo } from ".";

import candyget from "candyget";

import { AudioSource } from "./audiosource";
import { getCommandExecutionContext } from "../Commands";

export class Streamable extends AudioSource<string, StreamableJsonFormat> {
  protected streamUrl = "";

  async init(url: string, prefetched: StreamableJsonFormat | null){
    this.url = url;
    const id = StreamableApi.getVideoId(url);
    if(!id) throw new Error("Invalid streamable url");
    if(prefetched){
      this.lengthSeconds = prefetched.length;
      this.thumbnail = prefetched.thumbnail;
      this.title = prefetched.title;
      this.streamUrl = prefetched.streamUrl;
    }else{
      const streamInfo = await StreamableApi.getVideoDetails(id);
      this.lengthSeconds = Math.floor(streamInfo.files["mp4-mobile"].duration);
      this.thumbnail = "https:" + streamInfo.thumbnail_url;
      this.title = streamInfo.title;
      const streamUrl = streamInfo.files["mp4-mobile"].url;
      if(!streamUrl){
        throw new Error("Invalid streamable url.");
      }
      this.streamUrl = streamUrl;
    }
    return this;
  }

  async fetch(): Promise<UrlStreamInfo>{
    return {
      type: "url",
      streamType: "mp4",
      url: this.streamUrl,
    };
  }

  toField(){
    const { t } = getCommandExecutionContext();

    return [
      {
        name: ":link:URL",
        value: this.url,
      }, {
        name: `:asterisk:${t("moreInfo")}`,
        value: t("audioSources.fileInStramable"),
      },
    ];
  }

  npAdditional(){
    return "";
  }

  exportData(): StreamableJsonFormat{
    return {
      url: this.url,
      length: this.lengthSeconds,
      thumbnail: this.thumbnail,
      title: this.title,
      streamUrl: this.streamUrl,
    };
  }
}

export type StreamableJsonFormat = AudioSourceBasicJsonFormat & {
  thumbnail: string,
  streamUrl: string,
};

/**
 * Streamable (https://streamable.com)のAPIラッパ
 */
export abstract class StreamableApi {
  /**
   * 動画のURLから動画のIDを返します。動画のURL出ない場合にはnullが返されます。存在チェックは行っていません。
   * @param url 動画のURL
   * @returns 動画のID
   */
  static getVideoId(url: string): string | null {
    const match = url.match(/^https?:\/\/streamable.com\/(?<Id>.+)$/);
    if(match){
      return match.groups?.Id || null;
    }else{
      return null;
    }
  }

  static async getVideoDetails(id: string): Promise<StreamableAPIResult>{
    return candyget.json(`https://api.streamable.com/videos/${id}`).then(({ body }) => body as StreamableAPIResult);
  }
}

/**
 * APIから返却されるデータの型定義
 * Remarks: https://support.streamable.com/api-documentation
 * VSCode拡張 'Paste JSON as Code' (quicktype.quicktype)により生成 (https://quicktype.io)
 */
export interface StreamableAPIResult {
  status: number;
  percent: number;
  url: string;
  embed_code: string;
  message: null;
  files: Files;
  thumbnail_url: string;
  title: string;
  source: null;
}

interface Files {
  mp4: Mp4;
  "mp4-mobile": Mp4;
  original: Mp4;
}

interface Mp4 {
  status?: number;
  url?: string;
  framerate: number;
  height: number;
  width: number;
  bitrate: number;
  size: number;
  duration: number;
}
