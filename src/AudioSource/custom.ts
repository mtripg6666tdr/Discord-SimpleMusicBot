import type { EmbedField } from "discord.js";

import { AudioSource } from "./audiosource";
import { isAvailableRawAudioURL } from "../Util/util";
import { DefaultAudioThumbnailURL } from "../definition";

export class CustomStream extends AudioSource {
  protected _lengthSeconds = 0;
  protected _serviceIdentifer = "custom";
  Thumnail: string = DefaultAudioThumbnailURL;

  async init(url: string){
    if(!isAvailableRawAudioURL(url)) throw Error("正しいストリームではありません");
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
      value: this.Url,
    }, {
      name: ":asterisk:詳細",
      value: "カスタムストリーム",
    }] as EmbedField[];
  }

  npAdditional(){return "";}

  exportData(): exportableCustom{
    return {
      url: this.Url,
    };
  }
}

export type exportableCustom = {
  url: string,
};
