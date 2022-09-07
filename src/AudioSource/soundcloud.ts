/*
 * Copyright 2021-2022 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

import type { ReadableStreamInfo } from ".";
import type { EmbedField } from "eris";
import type { SoundcloudTrackV2 } from "soundcloud.ts";
import type { Readable } from "stream";

import SoundCloud from "soundcloud.ts";

import { Util } from "../Util";
import { AudioSource } from "./audiosource";

export class SoundCloudS extends AudioSource {
  protected _lengthSeconds = 0;
  protected readonly _serviceIdentifer = "soundcloud";
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

  async fetch():Promise<ReadableStreamInfo>{
    const sc = new SoundCloud();
    const source = await sc.util.streamTrack(this.Url) as Readable;
    const stream = Util.general.createPassThrough();
    source
      .on("error", e => !stream.destroyed ? stream.destroy(e) : stream.emit("error", e))
      .pipe(stream)
      .on("close", () => !source.destroyed && source.destroy?.())
    ;
    return {
      type: "readable",
      stream
    };
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

  static validateUrl(url:string){
    return Boolean(url.match(/https?:\/\/soundcloud.com\/.+\/.+/));
  }

  static validatePlaylistUrl(url:string){
    return Boolean(url.match(/https?:\/\/soundcloud.com\/[^/?]+\/sets\/[^/?]+/));
  }
}

export type exportableSoundCloud = {
  url:string,
  title:string,
  description:string,
  length:number,
  author:string,
  thumbnail:string,
};

/**
 * SoundCloud API Track Collection
 */
export interface SoundCloudTrackCollection {
  collection: SoundcloudTrackV2[];
  next_href: string;
  query_urn: null;
}
