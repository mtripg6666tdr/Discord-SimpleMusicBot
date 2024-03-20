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

import type { AudioSourceBasicJsonFormat, ReadableStreamInfo } from ".";
import type { i18n } from "i18next";
import type { SoundcloudTrackV2 } from "soundcloud.ts";
import type { Readable } from "stream";

import SoundCloud from "soundcloud.ts";

import { AudioSource } from "./audiosource";
import { createPassThrough } from "../Util";

let soundCloudClient = new SoundCloud();

export class SoundCloudS extends AudioSource<string, SoundcloudJsonFormat> {
  protected author: string;

  constructor(){
    super({ isSeekable: false });
  }

  async init(url: string, prefetched: SoundcloudJsonFormat | null, t: i18n["t"]){
    this.url = url;
    if(prefetched){
      this.title = prefetched.title;
      this.description = prefetched.description;
      this.lengthSeconds = prefetched.length;
      this.author = prefetched.author;
      this.thumbnail = prefetched.thumbnail;
    }else{
      const info = await soundCloudClient.tracks.getV2(url);
      this.title = info.title;
      this.description = info.description || t("unknown");
      this.lengthSeconds = Math.floor(info.duration / 1000);
      this.author = info.user.username;
      this.thumbnail = info.artwork_url;
    }
    return this;
  }

  async fetch(): Promise<ReadableStreamInfo>{
    const source = await soundCloudClient.util.streamTrack(this.url) as Readable;
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

  toField(verbose: boolean, t: i18n["t"]){
    return [
      {
        name: `:musical_note:${t("user")}`,
        value: this.author,
        inline: false,
      },
      {
        name: `:asterisk:${t("summary")}`,
        value: this.description.length > (verbose ? 1000 : 350) ? this.description.substring(0, verbose ? 1000 : 300) + "..." : this.description,
        inline: false,
      },
    ];
  }

  npAdditional(t: i18n["t"]){
    return `${t("audioSources.artist")}: \`${this.author}\``;
  }

  exportData(): SoundcloudJsonFormat{
    return {
      url: this.url,
      title: this.title,
      description: this.description,
      length: this.lengthSeconds,
      author: this.author,
      thumbnail: this.thumbnail,
    };
  }

  override purgeCache(){
    soundCloudClient = new SoundCloud();
  }

  static validateUrl(url: string){
    return Boolean(url.match(/https?:\/\/soundcloud.com\/.+\/.+/));
  }

  static validatePlaylistUrl(url: string){
    return Boolean(url.match(/https?:\/\/soundcloud.com\/[^/?]+\/sets\/[^/?]+/));
  }
}

export type SoundcloudJsonFormat = AudioSourceBasicJsonFormat & {
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
