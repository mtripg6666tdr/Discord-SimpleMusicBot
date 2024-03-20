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
import type { Readable } from "stream";

import { convert as htmlToText } from "html-to-text";
import NiconicoDL, { isValidURL } from "niconico-dl.js";

import { AudioSource } from "./audiosource";
import { createPassThrough } from "../Util";

export class NicoNicoS extends AudioSource<string, NiconicoJsonFormat> {
  private nico: NiconicoDL = null!;
  protected author = "";
  protected views = 0;

  constructor(){
    super({ isSeekable: false });
  }

  async init(url: string, prefetched: NiconicoJsonFormat, t: i18n["t"]){
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
      if(info.isDeleted || info.isPrivate){
        throw new Error(t("audioSources.videoNotPlayable"));
      }
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
    const stream = createPassThrough();
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

  toField(verbose: boolean, t: i18n["t"]){
    return [
      {
        name: `:cinema:${t("audioSources.videoAuthor")}`,
        value: this.author,
        inline: false,
      },
      {
        name: `:eyes:${t("audioSources.playCountLabel")}`,
        value: t("audioSources.playCount", { count: this.views }),
        inline: false,
      },
      {
        name: `:asterisk:${t("summary")}`,
        value: this.description.length > (verbose ? 1000 : 350)
          ? this.description.substring(0, verbose ? 1000 : 300) + "..."
          : this.description,
        inline: false,
      },
    ];
  }

  npAdditional(t: i18n["t"]){
    return `${t("audioSources.videoAuthor")}: ` + this.author;
  }

  exportData(): NiconicoJsonFormat{
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

export type NiconicoJsonFormat = AudioSourceBasicJsonFormat & {
  description: string,
  author: string,
  thumbnail: string,
  views: number,
};
