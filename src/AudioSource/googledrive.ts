import type { UrlStreamInfo } from ".";
import type { exportableCustom } from "./custom";
import type { EmbedField } from "eris";

import { Util } from "../Util";
import { DefaultAudioThumbnailURL } from "../definition";
import { AudioSource } from "./audiosource";

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
    // eslint-disable-next-line no-empty
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

  npAdditional(){return "";}

  exportData():exportableCustom{
    return {
      url: this.Url,
      length: this._lengthSeconds,
    };
  }

  static validateUrl(url:string){
    return Boolean(url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([^/?]+)(\/.+)?$/));
  }

  static getId(url:string){
    const match = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/(?<id>[^/?]+)(\/.+)?$/);
    return match ? match.groups.id : null;
  }
}
