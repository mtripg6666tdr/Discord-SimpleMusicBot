import type { EmbedField } from "discord.js";
import type { exportableCustom } from "./custom";
import { DefaultAudioThumbnailURL } from "../definition";
import { AudioSource } from "./audiosource";

export class GoogleDrive extends AudioSource {
  protected _lengthSeconds = 0;
  protected _serviceIdentifer = "googledrive";
  Thumnail:string = DefaultAudioThumbnailURL;

  async init(url:string){
    this.Title = "Googleドライブストリーム";
    this.Url = url;
    return this;
  }

  async fetch(){
    const match = this.Url.match(/drive\.google\.com\/file\/d\/([^\/\?]+)(\/.+)?/);
    return "https://drive.google.com/uc?id=" + match[1];
  }

  toField(){
    return [{
      name: ":link:URL",
      value: this.Url
    }, {
      name: ":asterisk:詳細",
      value: "Googleドライブにて共有されたファイル"
    }] as EmbedField[];
  }

  npAdditional(){return ""};

  exportData():exportableCustom{
    return {
      url:this.Url
    };
  }
}