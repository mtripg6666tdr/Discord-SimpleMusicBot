import { EmbedField } from "discord.js";
import * as ytdl from "ytdl-core";
import { AudioSource } from "./audiosource";

export class YouTube extends AudioSource {
  protected _serviceIdentifer = "youtube";
  protected _lengthSeconds = 0;
  ChannelName:string;
  Like:number;
  Dislike:number;
  Thumnail:string;
  LiveStream:boolean;

  toField(verbose:boolean = false){
    const fields = [] as EmbedField[];
    fields.push({
      name: ":cinema:チャンネル名",
      value: this.ChannelName,
      inline: false
    }, {
      name: ":asterisk:概要",
      value: this.Description.length > (verbose ? 1000 : 350) ? this.Description.substring(0, (verbose ? 1000 : 300)) + "..." : this.Description,
      inline: false
    }, {
      name: "⭐評価",
      value: ":+1:" + this.Like + "/:-1:" + this.Dislike,
      inline: false
    });
    return fields;
  }

  async fetch(){
    const info = await ytdl.getInfo(this.Url)
    const format = ytdl.chooseFormat(info.formats, {
      filter: this.LiveStream ? null : "audioonly",
      quality: this.LiveStream ? null : "highestaudio",
      isHLS: this.LiveStream
    } as any);
    console.log(format);
    return ytdl.downloadFromInfo(info, {
      format: format
    });
  }

  async init(url:string){
    const info = await ytdl.getInfo(url, {lang: "ja"});
    this.Url = url;
    this.Title = info.videoDetails.title;
    this.Description = info.videoDetails.description;
    this._lengthSeconds = Number(info.videoDetails.lengthSeconds);
    this.ChannelName = info.videoDetails.ownerChannelName;
    this.Like = info.videoDetails.likes;
    this.Dislike = info.videoDetails.dislikes;
    this.Thumnail = info.videoDetails.thumbnails[0].url;
    this.LiveStream = info.videoDetails.isLiveContent;
    return this;
  }

  npAdditional(){
    return "\r\nチャンネル名:`" + this.ChannelName + "`";
  }
}