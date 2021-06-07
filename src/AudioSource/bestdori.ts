import { EmbedField } from "discord.js";
import { bestdori, BestdoriAllBandInfoEndPoint, BestdoriAllSongInfoEndPoint, DefaultAudioThumbnailURL } from "../definition";
import { AddZero, DownloadText } from "../util";
import { AudioSource } from "./audiosource";

export class BestdoriS extends AudioSource {
  protected _lengthSeconds = 0;
  protected _serviceIdentifer = "bestdori";
  Thumnail = "";
  Artist = "";
  private id:number;

  async init(url:string){
    this.Url = url;
    await BestdoriApi.setupData();
    this.id = BestdoriApi.getAudioId(url);
    if(!this.id) throw "Invalid streamable url";
    const data = bestdori.allsonginfo[this.id];
    this.Title = data.musicTitle[0];
    this.Thumnail = "https://bestdori.com/assets/jp/musicjacket/musicjacket" + (Math.ceil(this.id / 10) * 10) + "_rip/assets-star-forassetbundle-startapp-musicjacket-musicjacket" + Math.ceil(this.id / 10) * 10 + "-" + data.jacketImage[0] + "-jacket.png";
    this.Artist = bestdori.allbandinfo[data.bandId].bandName[0];
    return this;
  }

  async fetch(){
    return "https://bestdori.com/assets/jp/sound/bgm" + AddZero(this.id.toString(), 3) +  "_rip/bgm" + AddZero(this.id.toString(), 3) + ".mp3";
  }

  toField(){
    return [
      {
        name: "バンド名",
        value: this.Artist,
        inline: false
      }
    ] as EmbedField[];
  }

  npAdditional(){return "\r\nアーティスト:`" + this.Artist + "`"}
}

/**
 * Bestdori (https://bestdori.com)のAPIラッパ
 */
export abstract class BestdoriApi {
  /**
   * BestdoriのURLからIDを返します。BestdoriのURLでない場合にはnullが返されます。存在チェックは行っていません。
   * @param url BestdoriのURL
   * @returns BestdoriのID
   */
  static getAudioId(url:string):number{
    var match = url.match(/^https?:\/\/bestdori\.com\/info\/songs\/(?<Id>\d+)(\/.*)?$/);
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
}