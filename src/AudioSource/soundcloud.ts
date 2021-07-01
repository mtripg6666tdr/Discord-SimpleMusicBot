import { EmbedField } from "discord.js";
import SoundCloud, { SoundcloudTrackV2 } from "soundcloud.ts";
import { InitPassThrough } from "../Util/util";
import { AudioSource } from "./audiosource";

export class SoundCloudS extends AudioSource {
  protected _lengthSeconds = 0;
  protected _serviceIdentifer = "soundcloud";
  Author:string;
  Thumnail:string;
  
  async init(url:string, prefetched?:exportableSoundCloud){
    this.Url = url;
    if(prefetched){
      this.Title = prefetched.title;
      this.Description = prefetched.description;
      this._lengthSeconds = prefetched.length;
      this.Author = prefetched.author;
      this.Thumnail = prefetched.thumbnail;
    }else{
      const sc = new SoundCloud();
      const info = await sc.tracks.getV2(url);
      this.Title = info.title;
      this.Description = info.description;
      this._lengthSeconds = Math.floor(info.duration / 1000);
      this.Author = info.user.username;
      this.Thumnail = info.artwork_url;
    }
    return this;
  }

  async fetch(){
    const sc = new SoundCloud();
    const stream = InitPassThrough();
    (await sc.util.streamTrack(this.Url)).on("error", (e)=>{
      stream.emit("error", e);
    }).pipe(stream);
    return stream;
  }

  toField(verbose:boolean = false){
    const fields = [] as EmbedField[];
    fields.push({
      name: ":musical_note:ユーザー",
      value: this.Author,
      inline: false
    }, {
      name: ":asterisk:概要",
      value: this.Description.length > (verbose ? 1000 : 350) ? this.Description.substring(0, (verbose ? 1000 : 300)) + "..." : this.Description,
      inline: false
    });
    return fields;
  }

  npAdditional(){
    return "\r\nアーティスト:`" + this.Author + "`";
  }

  exportData():exportableSoundCloud{
    return {
      url: this.Url,
      title: this.Title,
      description: this.Description,
      length: this._lengthSeconds,
      author: this.Author,
      thumbnail: this.Thumnail
    };
  }
}

export type exportableSoundCloud = {
  url:string;
  title:string;
  description:string;
  length:number;
  author:string;
  thumbnail:string;
}

/**
 * SoundCloud API Track Collection
 */
export interface SoundCloudTrackCollection {
  collection: SoundcloudTrackV2[];
  next_href:  string;
  query_urn:  null;
}