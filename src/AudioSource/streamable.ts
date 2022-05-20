import type { EmbedField } from "discord.js";
import { UrlStreamInfo } from ".";
import { DefaultAudioThumbnailURL } from "../definition";
import { Util } from "../Util";
import { AudioSource } from "./audiosource";

export class Streamable extends AudioSource {
  protected _lengthSeconds = 0;
  protected readonly _serviceIdentifer = "streamable";
  Thumnail = DefaultAudioThumbnailURL;
  private streamUrl = "";

  async init(url:string, prefetched?:exportableStreamable){
    this.Url = url;
    const id = StreamableApi.getVideoId(url);
    if(!id) throw "Invalid streamable url";
    if(prefetched){
      this._lengthSeconds = prefetched.length;
      this.Thumnail = prefetched.thumbnail;
      this.Title = prefetched.title;
      this.streamUrl = prefetched.streamUrl;
    }else{
      const streamInfo = await StreamableApi.getVideoDetails(id);
      this._lengthSeconds = Math.floor(streamInfo.files["mp4-mobile"].duration);
      this.Thumnail = "https:" + streamInfo.thumbnail_url;
      this.Title = streamInfo.title;
      this.streamUrl = streamInfo.files["mp4-mobile"].url;
    }
    return this;
  }

  async fetch():Promise<UrlStreamInfo>{
    return {
      type: "url",
      url: this.streamUrl
    };
  }

  toField(){
    return [{
      name: ":link:URL",
      value: this.Url
    }, {
      name: ":asterisk:詳細",
      value: "Streamableにて共有されたファイル"
    }] as EmbedField[];
  }

  npAdditional(){return ""};

  exportData():exportableStreamable{
    return {
      url: this.Url,
      length: this.LengthSeconds,
      thumbnail: this.Thumnail,
      title: this.Title,
      streamUrl: this.streamUrl
    };
  }
}

export type exportableStreamable = {
  url:string;
  length:number;
  thumbnail:string;
  title:string;
  streamUrl:string;
}

/**
 * Streamable (https://streamable.com)のAPIラッパ
 */
export abstract class StreamableApi {
  /**
   * 動画のURLから動画のIDを返します。動画のURL出ない場合にはnullが返されます。存在チェックは行っていません。
   * @param url 動画のURL
   * @returns 動画のID
   */
  static getVideoId(url:string):string{
    const match = url.match(/^https?:\/\/streamable.com\/(?<Id>.+)$/);
    if(match){
      return match.groups.Id
    }else{
      return null;
    }
  }

  static async  getVideoDetails(id:string):Promise<StreamableAPIResult> {
    const BASE_API = "https://api.streamable.com/videos/";
    return JSON.parse(await Util.web.DownloadText(BASE_API + id)) as StreamableAPIResult;
  }
}

/**
 * APIから返却されるデータの型定義
 * Remarks: https://support.streamable.com/api-documentation
 * VSCode拡張 'Paste JSON as Code' (quicktype.quicktype)により生成 (https://quicktype.io)
 */
export interface StreamableAPIResult {
  status:        number;
  percent:       number;
  url:           string;
  embed_code:    string;
  message:       null;
  files:         Files;
  thumbnail_url: string;
  title:         string;
  source:        null;
}

interface Files {
  mp4:          Mp4;
  "mp4-mobile": Mp4;
  original:     Mp4;
}

interface Mp4 {
  status?:   number;
  url?:      string;
  framerate: number;
  height:    number;
  width:     number;
  bitrate:   number;
  size:      number;
  duration:  number;
}