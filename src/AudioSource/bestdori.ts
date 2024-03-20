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

import type { AudioSourceBasicJsonFormat, UrlStreamInfo } from ".";

import candyget from "candyget";
import { i18n } from "i18next";

import { AudioSource } from "./audiosource";

export class BestdoriS extends AudioSource<string, BestdoriJsonFormat> {
  protected artist = "";
  protected type: "anime"|"normal"|null = null;
  protected lyricist: string;
  protected composer: string;
  protected arranger: string;
  private id: number;

  async init(url: string, prefetched: BestdoriJsonFormat, t: i18n["t"]){
    this.url = url;
    const id = BestdoriApi.instance.getAudioId(url);
    if(!id) throw new Error("Invalid streamable url");
    this.id = id;
    const data = (await BestdoriApi.instance.getSongInfo())[this.id];
    this.title = data.musicTitle[0];
    this.type = data.tag;
    this.thumbnail = BestdoriApi.instance.getThumbnailUrl(this.id, data.jacketImage[0]);
    this.artist = (await BestdoriApi.instance.getBandInfo())[data.bandId].bandName[0];
    if(prefetched){
      this.lengthSeconds = prefetched.length;
      this.lyricist = prefetched.lyricist;
      this.composer = prefetched.composer;
      this.arranger = prefetched.arranger;
    }else{
      const detailed = await BestdoriApi.instance.getDetailedSongInfo(this.id);
      this.lengthSeconds = Math.floor(detailed.length);
      this.lyricist = detailed.lyricist[0] || t("unknown");
      this.composer = detailed.composer[0] || t("unknown");
      this.arranger = detailed.arranger[0] || t("unknown");
    }

    this.isPrivateSource = true;

    return this;
  }

  async fetch(): Promise<UrlStreamInfo>{
    const paddedId = this.id.toString().padStart(3, "0");
    return {
      type: "url",
      streamType: "mp3",
      url: `https://bestdori.com/assets/jp/sound/bgm${paddedId}_rip/bgm${paddedId}.mp3`,
    };
  }

  toField(_: boolean, t: i18n["t"]){
    const typeMap = {
      anime: "カバー",
      normal: "アニメ",
    };
    return [
      {
        name: "バンド名",
        value: this.artist,
        inline: false,
      },
      {
        name: "ジャンル",
        value: typeMap[this.type as keyof typeof typeMap] || t("unknown"),
      },
      {
        name: "楽曲情報",
        value: "作詞: `" + (this.lyricist ?? "情報なし")
          + "` \r\n作曲: `" + (this.composer ?? "情報なし")
          + "` \r\n編曲: `" + (this.arranger ?? "情報なし") + "`",
        inline: false,
      },
    ];
  }

  npAdditional(){
    return `アーティスト:\`${this.artist}\``;
  }

  exportData(): BestdoriJsonFormat{
    return {
      url: this.url,
      length: this.lengthSeconds,
      lyricist: this.lyricist,
      composer: this.composer,
      arranger: this.arranger,
      title: this.title,
    };
  }
}

export type BestdoriJsonFormat = AudioSourceBasicJsonFormat & {
  lyricist: string,
  composer: string,
  arranger: string,
};

type ApiCache<T> = {
  lastUpdate: number,
  cache: T,
};

/**
 * Bestdori ( https://bestdori.com )のAPIラッパ
 */
export class BestdoriApi {
  private static _instance: BestdoriApi | null = null;

  static get instance(): BestdoriApi{
    return this._instance ??= new BestdoriApi();
  }

  private constructor(){}

  private readonly BestdoriAllSongInfoEndPoint = "https://bestdori.com/api/songs/all.5.json";
  private readonly BestdoriAllBandInfoEndPoint = "https://bestdori.com/api/bands/all.1.json";
  private allsonginfoCache: ApiCache<BestdoriAllSongInfo> = null!;
  private allbandinfoCache: ApiCache<BestdoriAllBandInfo> = null!;

  private async setupData(){
    const lastDateTime = new Date(new Date().toLocaleString(undefined, { timeZone: "Asia/Tokyo" }));
    lastDateTime.setMinutes(0);
    lastDateTime.setSeconds(0);
    lastDateTime.setMilliseconds(0);
    if(lastDateTime.getHours() > 15){
      lastDateTime.setHours(15);
    }else{
      lastDateTime.setHours(0);
    }

    if(!this.allbandinfoCache || lastDateTime.getTime() - this.allbandinfoCache.lastUpdate > 0){
      this.allbandinfoCache = {
        cache: await candyget.json(this.BestdoriAllBandInfoEndPoint).then(({ body }) => body),
        lastUpdate: Date.now(),
      };
    }
    if(!this.allsonginfoCache || lastDateTime.getTime() - this.allsonginfoCache.lastUpdate > 0){
      this.allsonginfoCache = {
        cache: await candyget.json(this.BestdoriAllSongInfoEndPoint).then(({ body }) => body),
        lastUpdate: Date.now(),
      };
    }
  }

  async getSongInfo(){
    await this.setupData();
    return this.allsonginfoCache.cache;
  }

  async getBandInfo(){
    await this.setupData();
    return this.allbandinfoCache.cache;
  }

  /**
   * BestdoriのURLからIDを返します。BestdoriのURLでない場合にはnullが返されます。存在チェックは行っていません。
   * @param url BestdoriのURL
   * @returns BestdoriのID
   */
  getAudioId(url: string): number | null {
    const match = url.match(/^https?:\/\/bestdori\.com\/info\/songs\/(?<Id>\d+)(\/.*)?$/);
    if(match){
      return Number(match.groups?.Id);
    }else{
      return null;
    }
  }

  getAudioPage(id: number){
    return `https://bestdori.com/info/songs/${id}`;
  }

  async getDetailedSongInfo(id: number): Promise<BestdoriDetailedSongInfo>{
    const apiUrl = `https://bestdori.com/api/songs/${id.toString()}.json`;
    return candyget.json(apiUrl).then(({ body }) => body);
  }

  getThumbnailUrl(id: number, jacketimage: string){
    return `https://bestdori.com/assets/jp/musicjacket/musicjacket${Math.ceil(id / 10) * 10}_rip/assets-star-forassetbundle-startapp-musicjacket-musicjacket${Math.ceil(id / 10) * 10}-${jacketimage}-jacket.png`;
  }
}

export type BandID = number;
export type SongID = number;

/**
 * APIから返却されるデータの型定義
 * Remarks: https://support.streamable.com/api-documentation
 * VSCode拡張 'Paste JSON as Code' (quicktype.quicktype)により生成 (https://quicktype.io)
 * (一部改変)
 */
export type BestdoriAllSongInfo = {
  [key: number]: {
    tag: "anime"|"normal",
    bandId: BandID,
    jacketImage: [string],
    musicTitle: [string, string, string, string, string],
    publishedAt: [string, string, string, string, string],
    closedAt: [string, string, string, string, string],
    difficulty: { [key in "0"|"1"|"2"|"3"|"4"]: { playLevel: number } },
  },
};
export type BestdoriAllBandInfo = {
  [key: number]: {
    bandName: [string, string, string, string, string],
  },
};
export interface BestdoriDetailedSongInfo {
  bgmId: SongID;
  bgmFile: string;
  tag: Tag;
  bandId: BandID;
  achievements: Achievement[];
  jacketImage: string[];
  seq: number;
  musicTitle: (null | string)[];
  lyricist: (null | string)[];
  composer: (null | string)[];
  arranger: (null | string)[];
  howToGet: (null | string)[];
  publishedAt: (null | string)[];
  closedAt: (null | string)[];
  difficulty: { [key: string]: Difficulty };
  length: number;
  notes: { [key: string]: number };
  bpm: { [key: string]: BPM[] };
}

export interface Achievement {
  musicId: number;
  achievementType: string;
  rewardType: RewardType;
  quantity: number;
  rewardId?: number;
}

export enum RewardType {
  Coin = "coin",
  PracticeTicket = "practice_ticket",
  Star = "star"
}

export interface BPM {
  bpm: number;
  start: number;
  end: number;
}

export interface Difficulty {
  playLevel: number;
  multiLiveScoreMap: { [key: string]: MultiLiveScoreMap };
  notesQuantity: number;
  scoreC: number;
  scoreB: number;
  scoreA: number;
  scoreS: number;
  scoreSS: number;
}

export interface MultiLiveScoreMap {
  musicId: number;
  musicDifficulty: Tag;
  multiLiveDifficultyId: number;
  scoreS: number;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  multiLiveDifficultyType: string;
  scoreSS: number;
}

export enum Tag {
  Easy = "easy",
  Expert = "expert",
  Hard = "hard",
  Normal = "normal"
}
