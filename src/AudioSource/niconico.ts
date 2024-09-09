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

import candyget from "candyget";
import { convert as htmlToText } from "html-to-text";
import parse from "node-html-parser";

import { AudioSource } from "./audiosource";
import { getCommandExecutionContext } from "../Commands";

export class NicoNicoS extends AudioSource<string, NiconicoJsonFormat> {
  private nicoTemp: NiconicoDL | null = null;
  protected author = "";
  protected views = 0;

  constructor() {
    super({ isSeekable: false });
  }

  async init(url: string, prefetched: NiconicoJsonFormat) {
    this.url = url;

    this.nicoTemp = new NiconicoDL(url);

    if (prefetched) {
      this.title = prefetched.title;
      this.description = htmlToText(prefetched.description);
      this.lengthSeconds = prefetched.length;
      this.author = prefetched.author;
      this.thumbnail = prefetched.thumbnail;
      this.views = prefetched.views;
    } else {
      const info = await this.nicoTemp.getInfo();
      this.title = info.data.response.video.title;
      this.description = htmlToText(info.data.response.video.description);
      this.lengthSeconds = info.data.response.video.duration;
      this.author = info.data.response.owner.nickname;
      this.thumbnail = info.data.response.video.thumbnail.url;
      this.views = info.data.response.video.count.view;
    }
    return this;
  }

  async fetch(): Promise<StreamInfo> {
    if (!this.nicoTemp) {
      throw new Error("The audio source is not initialized.");
    }

    const { url, cookie } = await this.nicoTemp.fetch();
    return {
      type: "url",
      streamType: "m3u8",
      url,
      cookie,
    };
  }

  toField(verbose: boolean) {
    const { t } = getCommandExecutionContext();

    return [
      {
        name: `:cinema: ${t("audioSources.videoAuthor")}`,
        value: this.author,
        inline: false,
      },
      {
        name: `:eyes: ${t("audioSources.playCountLabel")}`,
        value: t("audioSources.playCount", { count: this.views }),
        inline: false,
      },
      {
        name: `:asterisk: ${t("summary")}`,
        value: this.description.length > (verbose ? 1000 : 350)
          ? this.description.substring(0, verbose ? 1000 : 300) + "..."
          : this.description,
        inline: false,
      },
    ];
  }

  npAdditional() {
    const { t } = getCommandExecutionContext();

    return `${t("audioSources.videoAuthor")}: ` + this.author;
  }

  exportData(): NiconicoJsonFormat {
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

  static validateUrl(url: string) {
    return NiconicoDL.isWatchUrl(url);
  }
}

export type NiconicoJsonFormat = AudioSourceBasicJsonFormat & {
  description: string,
  author: string,
  thumbnail: string,
  views: number,
};


const niconicoTempWatchUrlRegex = /https:\/\/www\.nicovideo\.jp\/watch\/(?<id>sm\d+)/;

class NiconicoDL {
  private readonly _videoId: string;

  private _info: NiconicoMeta | null = null;

  constructor(url: string) {
    if (!NiconicoDL.isWatchUrl(url)) {
      throw new Error("The requested url is invalid.");
    }

    this._videoId = niconicoTempWatchUrlRegex.exec(url)!.groups!["id"]!;
  }

  static isWatchUrl(url: string) {
    return niconicoTempWatchUrlRegex.test(url);
  }

  async getInfo(): Promise<NiconicoMeta> {
    const { statusCode, body } = await candyget.string(`https://www.nicovideo.jp/watch/${this._videoId}`);
    if (statusCode < 200 || 300 <= statusCode) {
      throw new Error("Failed to fetch audio information.");
    }

    const root = parse(body);
    const content = root.querySelector("meta[name=server-response]")?.getAttribute("content");

    if (!content) {
      throw new Error("Failed to fetch audio information.");
    }

    return this._info = JSON.parse<NiconicoMeta>(content);
  }

  async fetch(): Promise<{ url: string, cookie: string }> {
    const info = this._info || await this.getInfo();

    const hlsInfoUrl = `https://nvapi.nicovideo.jp/v1/watch/${this._videoId}/access-rights/hls?actionTrackId=${info.data.response.client.watchTrackId}`;
    const audioDomandId = [...info.data.response.media.domand.audios].sort((a, b) => b.bitRate - a.bitRate)[0]?.id;

    if (!audioDomandId) {
      throw new Error("Failed to detect audio stream.");
    }

    const { statusCode, body, headers } = await candyget.json(hlsInfoUrl, {
      headers: {
        origin: "https://www.nicovideo.jp",
        referer: "https://www.nicovideo.jp/",
        "X-Access-Right-Key": info.data.response.media.domand.accessRightKey,
        "X-Request-With": "nicovideo",
        "X-Frontend-Id": "6",
        "X-Frontend-Version": "0",
        "X-Niconico-Language": "ja-jp",
      },
      body: {
        outputs: info.data.response.media.domand.videos.filter(({ isAvailable }) => isAvailable).map(({ id }) => [id, audioDomandId]),
      },
    });

    if (statusCode < 200 || 300 <= statusCode) {
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

type NiconicoMeta = WithStatusResult<{
  response: {
    client: {
      nicosid: string,
      watchId: string,
      watchTrackId: string,
    },
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
    owner: {
      iconUrl: string,
      id: number,
      nickname: string,
    },
  },
}>;

type NiconicoTempHlsInfo = WithStatusResult<{
  contentUrl: string,
  createTime: string,
  expireTime: string,
}>;
