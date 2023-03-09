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

import type * as Sources from ".";
import type { exportableCustom } from "./custom";
import type { EmbedField } from "oceanic.js";
import type { Readable } from "stream";

import { DefaultAudioThumbnailURL } from "../definition";

export type StreamTypeIdentifer =
  | "webm/opus"
  | "ogg/opus"
  | "mp3"
  | "mp4"
  | "raw"
  | "m3u8"
  | "unknown"
  | "opus";

export type AudioSourceTypeIdentifer =
  | "youtube"
  | "bestdori"
  | "custom"
  | "fs"
  | "googledrive"
  | "hibiki"
  | "niconico"
  | "soundcloud"
  | "spotify"
  | "streamable"
  | "twitter";

export type DynamicThumbnail = {
  ext: string,
  fetcher: () => Promise<Buffer>,
};

type ThumbnailType = string | DynamicThumbnail;

export abstract class AudioSource<T extends ThumbnailType> {
  private _url: string;
  get url(){
    return this._url;
  }
  protected set url(value: string) {
    this._url = value;
  }

  private _title: string;
  get title(){
    return this._title;
  }
  protected set title(value: string){
    this._title = value;
  }

  private _lengthSeconds: number = 0;
  get lengthSeconds(): number{
    return this._lengthSeconds;
  }
  protected set lengthSeconds(value: number){
    this._lengthSeconds = value;
  }

  private _description: string;
  get description(){
    return this._description;
  }
  protected set description(value: string){
    this._description = value;
  }

  // サムネイル
  private _thumbnail: T;
  get thumbnail(){
    return this._thumbnail || DefaultAudioThumbnailURL as T;
  }
  protected set thumbnail(value: T){
    this._thumbnail = value;
  }

  private readonly _serviceIdentifer: AudioSourceTypeIdentifer;
  protected get serviceIdentifer(): AudioSourceTypeIdentifer{
    return this._serviceIdentifer;
  }

  constructor(serviceType: AudioSourceTypeIdentifer){
    this._serviceIdentifer = serviceType;
  }

  // 現在再生中の曲を示すEmbedField
  abstract toField(verbose: boolean): EmbedField[];
  // 再生するためのストリームをフェッチ
  abstract fetch(url?: boolean): Promise<StreamInfo>;
  // クラスを初期化する非同期メソッド
  abstract init(url: string, prefetched: exportableCustom): Promise<AudioSource<T>>;
  // 現在再生中の曲に関する追加データ
  abstract npAdditional(): string;
  // データをエクスポート
  abstract exportData(): exportableCustom;

  isYouTube(): this is Sources.YouTube{
    return this.serviceIdentifer === "youtube";
  }

  isSoundCloudS(): this is Sources.SoundCloudS{
    return this.serviceIdentifer === "soundcloud";
  }

  isNicoNicoS(): this is Sources.NicoNicoS{
    return this.serviceIdentifer === "niconico";
  }

  isSpotify(): this is Sources.Spotify{
    return this.serviceIdentifer === "spotify";
  }

  isUnseekable(){
    return this.isSoundCloudS() || this.isNicoNicoS();
  }
}

export type StreamInfo = ReadableStreamInfo|UrlStreamInfo;
export type ReadableStreamInfo = {
  type: "readable",
  stream: Readable,
  streamType: StreamTypeIdentifer,
};
export type UrlStreamInfo = {
  type: "url",
  url: string,
  streamType: StreamTypeIdentifer,
  userAgent?: string,
};
