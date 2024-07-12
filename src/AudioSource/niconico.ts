/*
 * Copyright 2021-2024 mtripg6666tdr
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

import type { AudioSourceBasicJsonFormat, StreamInfo } from ".";
import type { Readable } from "stream";

import candyget from "candyget";
import { convert as htmlToText } from "html-to-text";
import NiconicoDL, { isValidURL } from "niconico-dl.js";

import { AudioSource } from "./audiosource";
import { getCommandExecutionContext } from "../Commands";
import { createPassThrough } from "../Util";

export class NicoNicoS extends AudioSource<string, NiconicoJsonFormat> {
  private nico: NiconicoDL | null = null;
  private nicoTemp: NiconicoTempDL | null = null;
  protected author = "";
  protected views = 0;

  constructor(){
    super({ isSeekable: false });
  }

  async init(url: string, prefetched: NiconicoJsonFormat){
    const { t } = getCommandExecutionContext();

    this.url = url;
    if(NiconicoTempDL.isTempWatchUrl(url)){
      this.nicoTemp = new NiconicoTempDL(url);
    }else{
      this.nico = new NiconicoDL(url, /* quality */ "high");
    }

    if(prefetched){
      this.title = prefetched.title;
      this.description = htmlToText(prefetched.description);
      this.lengthSeconds = prefetched.length;
      this.author = prefetched.author;
      this.thumbnail = prefetched.thumbnail;
      this.views = prefetched.views;
    }else if(NiconicoTempDL.isTempWatchUrl(url)){
      const info = await this.nicoTemp!.getInfo();
      this.title = info.data.video.title;
      this.description = htmlToText(info.data.video.description);
      this.lengthSeconds = info.data.video.duration;
      this.author = info.data.ownerNickname;
      this.thumbnail = info.data.video.thumbnail.url;
      this.views = info.data.video.count.view;
    }else{
      this.nico = new NiconicoDL(url, /* quality */ "high");
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

  async fetch(): Promise<StreamInfo>{
    if(this.nico){
      const stream = createPassThrough();
      const source = await this.nico.download() as Readable;
      source
        .on("error", e => !stream.destroyed ? stream.destroy(e) : stream.emit("error", e))
        .pipe(stream)
        .on("close", () => !source.destroyed && source.destroy?.());

      return {
        type: "readable",
        streamType: "unknown",
        stream,
      };
    }else if(this.nicoTemp){
      const { url, cookie } = await this.nicoTemp.fetch();
      return {
        type: "url",
        streamType: "m3u8",
        url,
        cookie,
      };
    }

    throw new Error("Noop");
  }

  toField(verbose: boolean){
    const { t } = getCommandExecutionContext();

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

  npAdditional(){
    const { t } = getCommandExecutionContext();

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
    return isValidURL(url) || NiconicoTempDL.isTempWatchUrl(url);
  }
}

export type NiconicoJsonFormat = AudioSourceBasicJsonFormat & {
  description: string,
  author: string,
  thumbnail: string,
  views: number,
};


const niconicoTempWatchUrlRegex = /https:\/\/www\.nicovideo\.jp\/watch_tmp\/(?<id>sm\d+)/;

class NiconicoTempDL {
  private readonly _videoId: string;
  private _info: NiconicoTempMeta | null = null;

  constructor(url: string){
    if(!NiconicoTempDL.isTempWatchUrl(url)){
      throw new Error("The requested url is invalid.");
    }

    this._videoId = niconicoTempWatchUrlRegex.exec(url)!.groups!["id"]!;
  }

  static isTempWatchUrl(url: string){
    return niconicoTempWatchUrlRegex.test(url);
  }

  async getInfo(): Promise<NiconicoTempMeta> {
    const { statusCode, body } = await candyget.json(`https://www.nicovideo.jp/api/watch/tmp/${this._videoId}?_frontendId=6&_frontendVersion=0.0.0`);
    if(statusCode < 200 || 300 <= statusCode){
      throw new Error("Failed to fetch audio information.");
    }

    return this._info = body as NiconicoTempMeta;
  }

  async fetch(): Promise<{ url: string, cookie: string }> {
    const info = this._info || await this.getInfo();

    const hlsInfoUrl = `https://nvapi.nicovideo.jp/v1/tmp/watch/${this._videoId}/access-rights/hls?actionTrackId=${info.data.client.watchTrackId}&_frontendId=6&_frontendVersion=0.0.0`;
    const audioDomandId = [...info.data.media.domand.audios].sort((a, b) => b.bitRate - a.bitRate)[0]?.id;

    if(!audioDomandId){
      throw new Error("Failed to detect audio stream.");
    }

    const { statusCode, body, headers } = await candyget.json(hlsInfoUrl, {
      headers: {
        origin: "https://www.nicovideo.jp",
        referer: "https://www.nicovideo.jp/",
        "X-Access-Right-Key": info.data.media.domand.accessRightKey,
        "X-Request-With": "https://www.nicovideo.jp",
      },
      body: {
        outputs: info.data.media.domand.videos.filter(({ isAvailable }) => isAvailable).map(({ id }) => [id, audioDomandId]),
      },
    });

    if(statusCode < 200 || 300 <= statusCode){
      throw new Error("Failed to fetch stream information.");
    }

    return {
      url: (body as NiconicoTempHlsInfo).data.contentUrl,
      cookie: headers["set-cookie"]!.join("\n"),
    };
  }
}

type WithStatusResult<T> = {
  meta: {
    status: number,
  },
  data: T,
};

type NiconicoTempMeta = WithStatusResult<{
  client: {
    nicosid: string,
    watchId: string,
    watchTrackId: string,
  },
  ownerNickname: string,
  video: {
    description: string,
    duration: number,
    id: string,
    thumbnail: {
      ogp: string,
      player: string,
      url: string,
    },
    title: string,
    count: {
      comment: number,
      like: number,
      mylist: number,
      view: number,
    },
  },
  media: {
    domand: {
      accessRightKey: string,
      videos: {
        bitRate: number,
        height: number,
        id: string,
        isAvailable: boolean,
        label: string,
        qualityLevel: number,
        recommendedHighestAudioQualityLevel: number,
        width: number,
      }[],
      isStoryboardAvailable: boolean,
      audios: {
        bitRate: number,
        id: string,
        integratedLoudness: number,
        isAvailable: boolean,
        loudnessCollection: unknown,
        qualityLevel: number,
        samplingRate: number,
        truePeak: number,
      }[],
    },
  },
}>;

type NiconicoTempHlsInfo = WithStatusResult<{
  contentUrl: string,
  createTime: string,
  expireTime: string,
}>;
