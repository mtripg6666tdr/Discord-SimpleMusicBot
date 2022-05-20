import type { EmbedField } from "discord.js";
import type { exportableCustom } from "./custom";
import { DefaultAudioThumbnailURL } from "../definition";
import { AudioSource } from "./audiosource";
import { UrlStreamInfo } from ".";
import { Util } from "../Util";

export class GoogleDrive extends AudioSource {
  protected _lengthSeconds = 0;
  protected readonly _serviceIdentifer = "googledrive";
  Thumnail:string = DefaultAudioThumbnailURL;

  async init(url:string){
    this.Title = "Googleドライブストリーム";
    this.Url = url;
    if(await Util.web.RetriveHttpStatusCode(this.Url) !== 200) throw new Error("URLがみつかりません");
    try{
      this._lengthSeconds = await Util.web.RetriveLengthSeconds((await this.fetch()).url);
    }
    catch{}
    return this;
  }

  async fetch():Promise<UrlStreamInfo>{
    const id = GoogleDrive.getId(this.Url);
    return {
      type: "url",
      url: "https://drive.google.com/uc?id=" + id,
    };
  }

  toField(){
    return [{
      name: ":asterisk:詳細",
      value: "Googleドライブにて共有されたファイル"
    }] as EmbedField[];
  }

  npAdditional(){return ""};

  exportData():exportableCustom{
    return {
      url: this.Url,
      length: this._lengthSeconds,
    };
  }

  static validateUrl(url:string){
    return Boolean(url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([^\/\?]+)(\/.+)?$/));
  }

  static getId(url:string){
    const match = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/(?<id>[^\/\?]+)(\/.+)?$/);
    return match ? match.groups.id : null;
  }
}