import type { UrlStreamInfo } from ".";
import type { EmbedField } from "discord.js";

import { Util } from "../Util";
import { DefaultAudioThumbnailURL } from "../definition";
import { AudioSource } from "./audiosource";

export class CustomStream extends AudioSource {
  protected _lengthSeconds = 0;
  protected readonly _serviceIdentifer = "custom";
  Thumnail:string = DefaultAudioThumbnailURL;

  async init(url:string){
    if(!Util.fs.isAvailableRawAudioURL(url)) throw new Error("正しいストリームではありません");
    this.Url = url;
    this.Title = this.extractFilename() || "カスタムストリーム";
    try{
      this._lengthSeconds = await Util.web.RetriveLengthSeconds(url);
    }
    // eslint-disable-next-line no-empty
    catch{}
    return this;
  }

  async fetch():Promise<UrlStreamInfo>{
    return {
      type: "url",
      url: this.Url
    };
  }

  toField(){
    return [{
      name: ":link:URL",
      value: this.Url
    }, {
      name: ":asterisk:詳細",
      value: "カスタムストリーム"
    }] as EmbedField[];
  }

  npAdditional(){return "";}

  exportData():exportableCustom{
    return {
      url: this.Url,
      length: this._lengthSeconds
    };
  }

  private extractFilename(){
    const paths = this.Url.split("/");
    return paths[paths.length - 1];
  }
}

export type exportableCustom = {
  url: string,
  length: number,
};
