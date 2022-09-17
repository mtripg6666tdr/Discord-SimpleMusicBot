/*
 * Copyright 2021-2022 mtripg6666tdr
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
import type { EmbedField } from "eris";
import type { Readable } from "stream";

export type StreamType =
| "dca"
| "ogg"
| "webm"
| "pcm"
;

export abstract class AudioSource {
  // ソースのURL
  Url:string;
  // サービス識別子
  protected abstract _serviceIdentifer:string;
  get ServiceIdentifer():"youtube"|string{
    return this._serviceIdentifer;
  }

  // タイトル(曲名)
  Title:string;
  // 曲の長さ(秒)
  protected abstract _lengthSeconds:number;
  get LengthSeconds():number{
    return this._lengthSeconds;
  }

  // 曲の説明
  Description:string;
  // サムネイル
  abstract Thumnail:string;
  // 現在再生中の曲を示すEmbedField
  abstract toField(verbose:boolean):EmbedField[];
  // 再生するためのストリームをフェッチ
  abstract fetch(url?:boolean):Promise<StreamInfo>;
  // クラスを初期化する非同期メソッド
  abstract init(url:string, prefetched:exportableCustom):Promise<AudioSource>;
  // 現在再生中の曲に関する追加データ
  abstract npAdditional():string;
  // データをエクスポート
  abstract exportData():exportableCustom;

  isYouTube():this is Sources.YouTube{return this.ServiceIdentifer === "youtube";}
  isSoundCloudS():this is Sources.SoundCloudS{return this.ServiceIdentifer === "soundcloud";}
  isNicoNicoS():this is Sources.NicoNicoS{return this.ServiceIdentifer === "niconico";}

  isUnseekable(){
    return this.isSoundCloudS() || this.isNicoNicoS();
  }
}

export type StreamInfo = ReadableStreamInfo|UrlStreamInfo;
export type ReadableStreamInfo = {
  type:"readable",
  stream:Readable,
  streamType?:StreamType,
};
export type UrlStreamInfo = {
  type:"url",
  url:string,
  streamType?:StreamType,
  userAgent?:string,
};
