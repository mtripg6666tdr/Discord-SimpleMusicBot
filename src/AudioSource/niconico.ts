import { EmbedField } from "discord.js";
import NiconicoDL, { isValidURL } from "niconico-dl.js";
import { convert as htmlToText } from "html-to-text";
import { exportableCustom, ReadableStreamInfo } from ".";
import { Util } from "../Util";
import { AudioSource } from "./audiosource";

export class NicoNicoS extends AudioSource {
  protected _lengthSeconds = 0;
  protected readonly _serviceIdentifer = "niconico";
  private nico = null as NiconicoDL
  Thumnail = "";
  Author = "";
  Views = 0;

  async init(url:string, prefetched:exportableNicoNico){
    this.Url = url;
    this.nico = new NiconicoDL(url, /* quality */ "high");
    if(prefetched){
      this.Title = prefetched.title;
      this.Description = htmlToText(prefetched.description);
      this._lengthSeconds = prefetched.length;
      this.Author = prefetched.author;
      this.Thumnail = prefetched.thumbnail;
      this.Views = prefetched.views;
    }else{
      const info = await this.nico.getVideoInfo();
      if(info.isDeleted || info.isPrivate) throw new Error("動画が再生できません");
      this.Title = info.title;
      this.Description = htmlToText(info.description);
      this._lengthSeconds = info.duration;
      this.Author = info.owner.nickname;
      this.Thumnail = info.thumbnail.url;
      this.Views = info.count.view;
    }
    return this;
  }

  async fetch():Promise<ReadableStreamInfo>{
    const stream = Util.general.InitPassThrough();
    (await this.nico.download())
      .on("error", e => stream.emit("error", e))
      .pipe(stream);
    return {
      type: "readable", stream
    };
  }

  toField(verbose:boolean = false){
    const fields = [] as EmbedField[];
    fields.push({
      name: ":cinema:投稿者",
      value: this.Author,
      inline: false
    }, {
      name: ":eyes:視聴回数",
      value: this.Views + "回",
      inline: false
    }, {
      name: ":asterisk:概要",
      value: this.Description.length > (verbose ? 1000 : 350) ? this.Description.substring(0, (verbose ? 1000 : 300)) + "..." : this.Description,
      inline: false
    });
    return fields;
  }

  npAdditional(){
    return "投稿者: " + this.Author;
  }

  exportData():exportableNicoNico{
    return {
      url: this.Url,
      length: this.LengthSeconds,
      title: this.Title,
      description: this.Description,
      author: this.Author,
      thumbnail: this.Thumnail,
      views: this.Views
    };
  }

  static validateUrl(url:string){
    return isValidURL(url);
  }
}

export type exportableNicoNico = exportableCustom & {
  title:string;
  description:string;
  author:string;
  thumbnail:string;
  views:number;
}