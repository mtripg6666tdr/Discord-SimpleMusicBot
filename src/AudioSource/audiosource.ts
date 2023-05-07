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
import type { LoggerObject } from "../logger";
import type { i18n } from "i18next";
import type { EmbedField } from "oceanic.js";
import type { Readable } from "stream";


import { DefaultAudioThumbnailURL } from "../definition";
import { getLogger } from "../logger";

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

/**
 * 音楽ボットで解釈できるオーディオファイルのソースを表します。
 * @template T サムネイルの種類
 */
export abstract class AudioSource<T extends ThumbnailType> {
  // リソースのURL
  // リソースに対して不変で、かつ一意である必要があります
  private _url: string;
  get url(){
    return this._url;
  }
  protected set url(value: string) {
    this._url = value;
  }

  // 曲のタイトル
  private _title: string;
  get title(){
    return this._title;
  }
  protected set title(value: string){
    this._title = value;
  }

  // 曲の長さ
  private _lengthSeconds: number = 0;
  get lengthSeconds(): number{
    return this._lengthSeconds;
  }
  protected set lengthSeconds(value: number){
    this._lengthSeconds = value;
  }

  // 曲の説明
  private _description: string;
  get description(){
    return this._description;
  }
  protected set description(value: string){
    this._description = value;
  }

  // キャッシュできないかどうかを表すフラグ
  protected _unableToCache: boolean = false;
  get unableToCache(){
    return this._unableToCache;
  }

  // サムネイル
  private _thumbnail: T;
  get thumbnail(){
    return this._thumbnail || DefaultAudioThumbnailURL as T;
  }
  protected set thumbnail(value: T){
    this._thumbnail = value;
  }

  // サービス識別子
  private readonly _serviceIdentifer: AudioSourceTypeIdentifer;
  protected get serviceIdentifer(): AudioSourceTypeIdentifer{
    return this._serviceIdentifer;
  }

  // 非公開ソースかどうかを表すフラグ
  private _isPrivateSource: boolean = false;
  get isPrivateSource(){
    return this._isPrivateSource;
  }
  protected set isPrivateSource(value: boolean){
    this._isPrivateSource = value;
  }

  /** オーディオソースの種類に対して生成されるロガーを表します */
  protected logger: LoggerObject;

  constructor(serviceType: AudioSourceTypeIdentifer){
    this._serviceIdentifer = serviceType;
    this.logger = getLogger(this.constructor.name);
  }

  /** 現在再生中の曲を示すEmbedFieldを生成します。 */
  abstract toField(verbose: boolean, t: i18n["t"]): EmbedField[];
  /** クラスを非同期で初期化します。 */
  abstract init(url: string, prefetched: exportableCustom, t: i18n["t"]): Promise<AudioSource<T>>;
  /** 再生するためのストリームをフェッチします。 */
  abstract fetch(url?: boolean, t?: i18n["t"]): Promise<StreamInfo>;
  /** 現在再生中の曲に関する追加データを生成します。 */
  abstract npAdditional(t: i18n["t"]): string;
  /** データをプレーンなオブジェクトにエクスポートします。 */
  abstract exportData(): exportableCustom;

  /**
   * 内部情報のキャッシュに対応しているソースに対して、キャッシュデータの削除を実行します。
   * それ以外のソースではこの関数は何もしません。
   */
  purgeCache(){}

  /** ソースがYouTubeのストリームであるかどうかを表します。 */
  isYouTube(): this is Sources.YouTube{
    return this.serviceIdentifer === "youtube";
  }

  /** ソースがSoundCloudのストリームであるかどうかを表します */
  isSoundCloudS(): this is Sources.SoundCloudS{
    return this.serviceIdentifer === "soundcloud";
  }

  /** ソースがニコニコ動画のストリームであるかどうかを表します。 */
  isNicoNicoS(): this is Sources.NicoNicoS{
    return this.serviceIdentifer === "niconico";
  }

  /** ソースがSpotifyのストリームであるかどうかを表します。 */
  isSpotify(): this is Sources.Spotify{
    return this.serviceIdentifer === "spotify";
  }

  /** ソースがシークできるかどうかを表します */
  isUnseekable(){
    return this.isSoundCloudS() || this.isNicoNicoS();
  }

  /** プライベートなソースとして設定します */
  markAsPrivateSource(){
    this.isPrivateSource = true;
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
