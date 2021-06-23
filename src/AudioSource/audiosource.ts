import { EmbedField } from "discord.js";
import { Readable } from "stream";
import { exportableCustom } from "./custom";

export abstract class AudioSource {
  // ソースのURL
  Url:string;
  // サービス識別子
  protected abstract _serviceIdentifer:string;
  get ServiceIdentifer():string{
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
  abstract fetch():Promise<Readable|string|HLSstream>;
  // クラスを初期化する非同期メソッド
  abstract init(url:string, prefetched:exportableCustom):Promise<AudioSource>;
  // 現在再生中の曲に関する追加データ
  abstract npAdditional():string;
  // データをエクスポート
  abstract exportData():exportableCustom;
}

export type HLSstream = {type:"HLS",url:string}