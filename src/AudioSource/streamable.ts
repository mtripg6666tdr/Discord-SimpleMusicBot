import { EmbedField } from "discord.js";
import { DefaultAudioThumbnailURL } from "../definition";
import { DownloadText } from "../util";
import { AudioSource } from "./audiosource";

export class Streamable extends AudioSource {
  protected _lengthSeconds = 0;
  protected _serviceIdentifer = "streamable";
  Thumnail = DefaultAudioThumbnailURL;
  private streamInfo:StreamableAPIResult = null;

  async init(url:string){
    this.Url = url;
    this.Title = "Streamableストリーム";
    const id = StreamableApi.getVideoId(url);
    if(!id) throw "Invalid streamable url";
    this.streamInfo = await StreamableApi.getVideoDetails(id);
    this._lengthSeconds = Math.floor(this.streamInfo.files["mp4-mobile"].duration);
    this.Thumnail = "https:" + this.streamInfo.thumbnail_url;
    this.Title = this.streamInfo.title;
    return this;
  }

  async fetch(){
    const data = DownloadText(this.Url);
    return this.streamInfo.files["mp4-mobile"].url;
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
    var match = url.match(/^https?:\/\/streamable.com\/(?<Id>.+)$/);
    if(match){
      return match.groups.Id
    }else{
      return null;
    }
  }

  static async  getVideoDetails(id:string):Promise<StreamableAPIResult> {
    const BASE_API = "https://api.streamable.com/videos/";
    return JSON.parse(await DownloadText(BASE_API + id)) as StreamableAPIResult;
  }
}

/**
 * APIから返却されるデータの型定義
 * Remarks: https://support.streamable.com/api-documentation
 * VSCode拡張 'Paste JSON as Code' (quicktype.quicktype)により生成
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
