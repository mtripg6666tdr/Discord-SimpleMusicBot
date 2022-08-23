import type * as Sources from ".";
import type { exportableCustom } from "./custom";
import type { EmbedField } from "eris";
import type { Readable } from "stream";

type StreamType =
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
  isStreamable():this is Sources.Streamable{return this.ServiceIdentifer === "streamable";}
  isSoundCloudS():this is Sources.SoundCloudS{return this.ServiceIdentifer === "soundcloud";}
  isHibiki():this is Sources.Hibiki{return this.ServiceIdentifer === "hibiki";}
  isGoogleDrive():this is Sources.GoogleDrive{return this.ServiceIdentifer === "goodledrive";}
  isCustomStream():this is Sources.CustomStream{return this.ServiceIdentifer === "custom";}
  isBestdoriS():this is Sources.BestdoriS{return this.ServiceIdentifer === "bestdori";}
  isNicoNicoS():this is Sources.NicoNicoS{return this.ServiceIdentifer === "niconico";}

  isUnseekable(){
    return this.isSoundCloudS() || this.isNicoNicoS();
  }
}

export type StreamInfo = ReadableStreamInfo|UrlStreamInfo;
export type ReadableStreamInfo = {type:"readable", stream:Readable, streamType?:StreamType};
export type UrlStreamInfo = {type:"url", url:string, userAgent?:string};
