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

import type { exportableCustom, ReadableStreamInfo } from ".";
import type { EmbedField } from "eris";
import type { Readable } from "stream";

import { convert as htmlToText } from "html-to-text";
import NiconicoDL, { isValidURL } from "niconico-dl.js";

import { Util } from "../Util";
import { AudioSource } from "./audiosource";

export class NicoNicoS extends AudioSource {
  protected _lengthSeconds = 0;
  protected readonly _serviceIdentifer = "niconico";
  private nico = null as NiconicoDL;
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
    const stream = Util.general.createPassThrough();
    const source = await this.nico.download() as Readable;
    source
      .on("error", e => !stream.destroyed ? stream.destroy(e) : stream.emit("error", e))
      .pipe(stream)
      .on("close", () => !source.destroyed && source.destroy?.())
    ;
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
  title:string,
  description:string,
  author:string,
  thumbnail:string,
  views:number,
};
