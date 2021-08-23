import { EmbedField } from "discord.js";
import { DefaultAudioThumbnailURL } from "../definition";
import { isAvailableRawAudioURL } from "../Util";
import { AudioSource } from "./audiosource";

export class CustomStream extends AudioSource {
  protected _lengthSeconds = 0;
  protected _serviceIdentifer = "custom";
  Thumnail:string = DefaultAudioThumbnailURL;

  async init(url:string){
    if(!isAvailableRawAudioURL(url)) throw "正しいストリームではありません"
    this.Url = url;
    this.Title = "カスタムストリーム";
    return this;
  }

  async fetch(){
    return this.Url;
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

  npAdditional(){return ""};

  exportData():exportableCustom{
    return {
      url:this.Url
    };
  }
}

export type exportableCustom = {
  url: string;
}