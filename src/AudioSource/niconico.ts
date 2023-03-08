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
import type { Readable } from "stream";

import { convert as htmlToText } from "html-to-text";
import NiconicoDL, { isValidURL } from "niconico-dl.js";

import { AudioSource } from "./audiosource";
import { Util } from "../Util";

export class NicoNicoS extends AudioSource<string> {
  private nico = null as NiconicoDL;
  protected author = "";
  protected views = 0;

  constructor(){
    super("niconico");
  }

  async init(url: string, prefetched: exportableNicoNico){
    this.url = url;
    this.nico = new NiconicoDL(url, /* quality */ "high");
    if(prefetched){
      this.title = prefetched.title;
      this.description = htmlToText(prefetched.description);
      this.lengthSeconds = prefetched.length;
      this.author = prefetched.author;
      this.thumbnail = prefetched.thumbnail;
      this.views = prefetched.views;
    }else{
      const info = await this.nico.getVideoInfo();
      if(info.isDeleted || info.isPrivate) throw new Error("動画が再生できません");
      this.title = info.title;
      this.description = htmlToText(info.description);
      this.lengthSeconds = info.duration;
      this.author = info.owner.nickname;
      this.thumbnail = info.thumbnail.url;
      this.views = info.count.view;
    }
    return this;
  }

  async fetch(): Promise<ReadableStreamInfo>{
    const stream = Util.general.createPassThrough();
    const source = await this.nico.download() as Readable;
    source
      .on("error", e => !stream.destroyed ? stream.destroy(e) : stream.emit("error", e))
      .pipe(stream)
      .on("close", () => !source.destroyed && source.destroy?.())
    ;
    return {
      type: "readable",
      streamType: "unknown",
      stream,
    };
  }

  toField(verbose: boolean = false){
    const fields = [] as EmbedField[];
    fields.push({
      name: ":cinema:投稿者",
      value: this.author,
      inline: false,
    }, {
      name: ":eyes:視聴回数",
      value: this.views + "回",
      inline: false,
    }, {
      name: ":asterisk:概要",
      value: this.description.length > (verbose ? 1000 : 350) ? this.description.substring(0, verbose ? 1000 : 300) + "..." : this.description,
      inline: false,
    });
    return fields;
  }

  npAdditional(){
    return "投稿者: " + this.author;
  }

  exportData(): exportableNicoNico{
    return {
      url: this.url,
      length: this.lengthSeconds,
      title: this.title,
      description: this.description,
      author: this.author,
      thumbnail: this.thumbnail,
      views: this.views,
    };
  }

  static validateUrl(url: string){
    return isValidURL(url);
  }
}

export type exportableNicoNico = exportableCustom & {
  description: string,
  author: string,
  thumbnail: string,
  views: number,
};
