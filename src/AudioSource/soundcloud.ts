/*
 * Copyright 2021-2023 mtripg6666tdr
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

import type { exportableCustom, ReadableStreamInfo } from ".";
import type { EmbedField } from "oceanic.js";
import type { SoundcloudTrackV2 } from "soundcloud.ts";
import type { Readable } from "stream";

import SoundCloud from "soundcloud.ts";

import { AudioSource } from "./audiosource";
import { createPassThrough } from "../Util";

export class SoundCloudS extends AudioSource<string> {
  protected author: string;

  constructor(){
    super("soundcloud");
  }

  async init(url: string, prefetched?: exportableSoundCloud){
    this.url = url;
    if(prefetched){
      this.title = prefetched.title;
      this.description = prefetched.description;
      this.lengthSeconds = prefetched.length;
      this.author = prefetched.author;
      this.thumbnail = prefetched.thumbnail;
    }else{
      const sc = new SoundCloud();
      const info = await sc.tracks.getV2(url);
      this.title = info.title;
      this.description = info.description;
      this.lengthSeconds = Math.floor(info.duration / 1000);
      this.author = info.user.username;
      this.thumbnail = info.artwork_url;
    }
    return this;
  }

  async fetch(): Promise<ReadableStreamInfo>{
    const sc = new SoundCloud();
    const source = await sc.util.streamTrack(this.url) as Readable;
    const stream = createPassThrough();
    source
      .on("error", e => !stream.destroyed ? stream.destroy(e) : stream.emit("error", e))
      .pipe(stream)
      .on("close", () => !source.destroyed && source.destroy?.())
    ;
    return {
      type: "readable",
      stream,
      streamType: "mp3",
    };
  }

  toField(verbose: boolean = false){
    const fields = [] as EmbedField[];
    fields.push({
      name: ":musical_note:ユーザー",
      value: this.author,
      inline: false,
    }, {
      name: ":asterisk:概要",
      value: this.description.length > (verbose ? 1000 : 350) ? this.description.substring(0, verbose ? 1000 : 300) + "..." : this.description,
      inline: false,
    });
    return fields;
  }

  npAdditional(){
    return "\r\nアーティスト:`" + this.author + "`";
  }

  exportData(): exportableSoundCloud{
    return {
      url: this.url,
      title: this.title,
      description: this.description,
      length: this.lengthSeconds,
      author: this.author,
      thumbnail: this.thumbnail,
    };
  }

  static validateUrl(url: string){
    return Boolean(url.match(/https?:\/\/soundcloud.com\/.+\/.+/));
  }

  static validatePlaylistUrl(url: string){
    return Boolean(url.match(/https?:\/\/soundcloud.com\/[^/?]+\/sets\/[^/?]+/));
  }
}

export type exportableSoundCloud = exportableCustom & {
  description: string,
  author: string,
  thumbnail: string,
};

/**
 * SoundCloud API Track Collection
 */
export interface SoundCloudTrackCollection {
  collection: SoundcloudTrackV2[];
  next_href: string;
  query_urn: null;
}
