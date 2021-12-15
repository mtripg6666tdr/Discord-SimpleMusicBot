import type { EmbedField } from "discord.js";
import { UrlStreamInfo } from ".";
import { AddZero, DownloadText } from "../Util";
import { AudioSource } from "./audiosource";

export class BestdoriS extends AudioSource {
  protected _lengthSeconds = 0;
  protected _serviceIdentifer = "bestdori";
  Thumnail = "";
  Artist = "";
  Type:"anime"|"normal"|null = null;
  lyricist:string;
  composer:string;
  arranger:string;
  private id:number;

  async init(url:string, prefetched:exportableBestdori){
    this.Url = url;
    await BestdoriApi.setupData();
    this.id = BestdoriApi.getAudioId(url);
    if(!this.id) throw "Invalid streamable url";
    const data = bestdori.allsonginfo[this.id];
    this.Title = data.musicTitle[0];
    this.Type = data.tag;
    this.Thumnail = BestdoriApi.getThumbnail(this.id, data.jacketImage[0]);
    this.Artist = bestdori.allbandinfo[data.bandId].bandName[0];
    if(prefetched){
      this._lengthSeconds = prefetched.length;
      this.lyricist = prefetched.lyricist;
      this.composer = prefetched.composer;
      this.arranger = prefetched.arranger;
    }else{
      const detailed = await BestdoriApi.getDetailedInfo(this.id);
      this._lengthSeconds = Math.floor(detailed.length);
      this.lyricist = detailed.lyricist[0];
      this.composer = detailed.composer[0];
      this.arranger = detailed.arranger[0];
    }
    return this;
  }

  async fetch():Promise<UrlStreamInfo>{
    return {
      type: "url",
      url:"https://bestdori.com/assets/jp/sound/bgm" + AddZero(this.id.toString(), 3) +  "_rip/bgm" + AddZero(this.id.toString(), 3) + ".mp3"
    }
  }

  toField(){
    const typeMap = {
      anime: "カバー",
      normal: "アニメ"
    };
    return [
      {
        name: "バンド名",
        value: this.Artist,
        inline: false
      },
      {
        name: "ジャンル",
        value: typeMap[this.Type]
      },
      {
        name: "楽曲情報",
        value: "作詞: `" + (this.lyricist ?? "情報なし")
          + "` \r\n作曲: `" + (this.composer ?? "情報なし")
          + "` \r\n編曲: `" + (this.arranger ?? "情報なし") + "`",
        inline: false
      }
    ] as EmbedField[];
  }

  npAdditional(){return "\r\nアーティスト:`" + this.Artist + "`"};

  exportData():exportableBestdori{
    return {
      url: this.Url,
      length: this.LengthSeconds,
      lyricist: this.lyricist,
      composer: this.composer,
      arranger: this.arranger
    };
  }
}

export type exportableBestdori = {
  url:string;
  length:number;
  lyricist:string;
  composer:string;
  arranger:string;
}

/**
 * Bestdori ( https://bestdori.com )のAPIラッパ
 */
export abstract class BestdoriApi {
  /**
   * BestdoriのURLからIDを返します。BestdoriのURLでない場合にはnullが返されます。存在チェックは行っていません。
   * @param url BestdoriのURL
   * @returns BestdoriのID
   */
  static getAudioId(url:string):number{
    const match = url.match(/^https?:\/\/bestdori\.com\/info\/songs\/(?<Id>\d+)(\/.*)?$/);
    if(match){
      return Number(match.groups.Id);
    }else{
      return null;
    }
  }

  static async setupData(){
    if(!bestdori.allbandinfo){
      bestdori.allbandinfo = JSON.parse(await DownloadText(BestdoriAllBandInfoEndPoint));
    }
    if(!bestdori.allsonginfo){
      bestdori.allsonginfo = JSON.parse(await DownloadText(BestdoriAllSongInfoEndPoint));
    }
  }

  static getAudioPage(id:number):string {
    return "https://bestdori.com/info/songs/" + id;
  }

  static async getDetailedInfo(id:number){
    const apiUrl = "https://bestdori.com/api/songs/" + id.toString() + ".json";
    return JSON.parse(await DownloadText(apiUrl)) as BestdoriDetailedSongInfo;
  }

  static getThumbnail(id:number, jacketimage:string){
    return "https://bestdori.com/assets/jp/musicjacket/musicjacket" + (Math.ceil(id / 10) * 10) + "_rip/assets-star-forassetbundle-startapp-musicjacket-musicjacket" + Math.ceil(id / 10) * 10 + "-" + jacketimage + "-jacket.png"
  }
}

export const BestdoriAllSongInfoEndPoint = "https://bestdori.com/api/songs/all.5.json";
export const BestdoriAllBandInfoEndPoint = "https://bestdori.com/api/bands/all.1.json";
class BestdoriData {
  allsonginfo:BestdoriAllSongInfo = null;
  allbandinfo:BestdoriAllBandInfo = null;
}
export const bestdori = new BestdoriData();
export type BandID = number;
export type SongID = number;

/**
 * APIから返却されるデータの型定義
 * Remarks: https://support.streamable.com/api-documentation
 * VSCode拡張 'Paste JSON as Code' (quicktype.quicktype)により生成 (https://quicktype.io)
 * (一部改変)
 */
export type BestdoriAllSongInfo = {
  [key:number]:{
      tag:"anime"|"normal",
      bandId:BandID,
      jacketImage:[string],
      musicTitle:[string,string,string,string,string],
      publishedAt:[string,string,string,string,string],
      closedAt:[string,string,string,string,string],
      difficulty:{[key in "0"|"1"|"2"|"3"|"4"]:{playLevel:number}}
  }
}
export type BestdoriAllBandInfo = {
  [key:number]:{
      bandName:[string,string,string,string,string]
  }
}
export interface BestdoriDetailedSongInfo {
  bgmId:        SongID;
  bgmFile:      string;
  tag:          Tag;
  bandId:       BandID;
  achievements: Achievement[];
  jacketImage:  string[];
  seq:          number;
  musicTitle:   Array<null | string>;
  lyricist:     Array<null | string>;
  composer:     Array<null | string>;
  arranger:     Array<null | string>;
  howToGet:     Array<null | string>;
  publishedAt:  Array<null | string>;
  closedAt:     Array<null | string>;
  difficulty:   { [key: string]: Difficulty };
  length:       number;
  notes:        { [key: string]: number };
  bpm:          { [key: string]: BPM[] };
}

export interface Achievement {
  musicId:         number;
  achievementType: string;
  rewardType:      RewardType;
  quantity:        number;
  rewardId?:       number;
}

export enum RewardType {
  Coin = "coin",
  PracticeTicket = "practice_ticket",
  Star = "star",
}

export interface BPM {
  bpm:   number;
  start: number;
  end:   number;
}

export interface Difficulty {
  playLevel:         number;
  multiLiveScoreMap: { [key: string]: MultiLiveScoreMap };
  notesQuantity:     number;
  scoreC:            number;
  scoreB:            number;
  scoreA:            number;
  scoreS:            number;
  scoreSS:           number;
}

export interface MultiLiveScoreMap {
  musicId:                 number;
  musicDifficulty:         Tag;
  multiLiveDifficultyId:   number;
  scoreS:                  number;
  scoreA:                  number;
  scoreB:                  number;
  scoreC:                  number;
  multiLiveDifficultyType: string;
  scoreSS:                 number;
}

export enum Tag {
  Easy = "easy",
  Expert = "expert",
  Hard = "hard",
  Normal = "normal",
}
