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

import type { StreamInfo } from "./audiosource";
import type { exportableCustom } from "./custom";
import type { EmbedField } from "eris";
import type ytsr from "ytsr";

import candyget from "candyget";

import { AudioSource } from "./audiosource";
import { searchYouTube } from "./youtube/spawner";
import { attemptFetchForStrategies } from "./youtube/strategies";
import Util from "../Util";
import { DefaultAudioThumbnailURL } from "../definition";

const spotifyUrlInfo = (() => {
  try{
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    return require("spotify-url-info") as typeof import("spotify-url-info");
  }
  catch{
    return null;
  }
})();

const client = spotifyUrlInfo?.((url, opts) => candyget(url, "string", opts).then(res => ({text: () => res.body})));

export class Spotify extends AudioSource {
  protected readonly _serviceIdentifer = "spotify";
  protected _lengthSeconds = 0;
  protected artist = "";
  Thumnail = DefaultAudioThumbnailURL;

  override async init(url: string, prefetched: exportableSpotify): Promise<Spotify>{
    if(!Spotify.validateTrackUrl(url)) throw new Error("Invalid url");
    if(prefetched){
      this.Url = prefetched.url;
      this._lengthSeconds = prefetched.length;
      this.Title = prefetched.title;
      this.artist = prefetched.artist;
    }else{
      this.Url = url;
      const track = (await client.getTracks(url))[0];
      this._lengthSeconds = Math.floor(track.duration / 1000);
      this.Title = track.name;
      this.artist = track.artist;
    }
    return this;
  }

  override async fetch(forceUrl?: boolean): Promise<StreamInfo>{
    const searchResult = await searchYouTube(`${this.Title} ${this.artist}`);
    const items = searchResult.items.filter(({type}) => type === "video") as ytsr.Video[];
    const target = this.extractBestItem(items);
    if(!target) throw new Error("Not Found");
    const { result } = await attemptFetchForStrategies(Util.logger.log.bind(Util.logger), target.url, forceUrl);
    this.Title = result.info.title;
    this._lengthSeconds = result.info.length;
    this.Thumnail = result.info.thumbnail;
    return result.stream;
  }

  protected extractBestItem(items:ytsr.Video[]){
    console.log("result", items);
    const includes = (text1:string, text2:string) => {
      text1 = text1.toLowerCase().replace(/’/g, "'");
      text2 = text2.toLowerCase().replace(/’/g, "'");
      return text1.includes(text2);
    };
    const validate = (item:ytsr.Video) => {
      return (
        // 関連のないタイトルを除外
        includes(item.title, this.Title.toLowerCase()) || includes(this.Title, item.title.toLowerCase())
      )
      // カバー曲を除外
      && !includes(item.title, "cover")
      && !includes(item.title, "カバー")
      && !includes(item.title, "歌ってみた")
      && !includes(item.title, "弾いてみた");
    };
    const validItems = items.filter(validate);
    console.log("valid", validItems);
    // official channel
    let filtered = validItems.filter(item => item.author.ownerBadges.length > 0 || item.author.verified || item.author.name.endsWith("Topic") || item.author.name.endsWith("トピック"));
    console.log("official ch", filtered);
    if(filtered[0]) return filtered[0];
    // official item 
    filtered = validItems.filter(item => includes(item.title, "official") || includes(item.title, "公式"));
    console.log("official item", filtered);
    if(filtered[0]) return filtered[0];
    // pv /mv
    filtered = validItems.filter(item => includes(item.title, "pv") || includes(item.title, "mv"));
    console.log("PV/MV", filtered);
    if(filtered[0]) return filtered[0];
    // no live
    filtered = validItems.filter(item => !includes(item.title, "live") && !includes(item.title, "ライブ"));
    console.log("no live", filtered);
    if(filtered[0]) return filtered[0];
    // other
    if(validItems[0]) return validItems[0];
    return items[0];
  }

  override exportData(): exportableSpotify{
    return {
      url: this.Url,
      title: this.Title,
      length: this.LengthSeconds,
      artist: this.artist,
    };
  }

  override npAdditional(): string{
    return "";
  }

  override toField(): EmbedField[]{
    return [];
  }

  static validateTrackUrl(url:string){
    return !!url.match(/^https?:\/\/open\.spotify\.com\/track\/([a-zA-Z0-9]+)(\?.*)?$/);
  }

  static validatePlaylistUrl(url:string){
    return !!url.match(/^https?:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)(\?.*)?$/);
  }

  static getTrackUrl(uri:string){
    return `https://open.spotify.com/track/${uri.replace(/spotify:track:/, "")}`;
  }

  static getPlaylistUrl(uri:string){
    return `https://open.spotify.com/playlist/${uri.replace(/spotify:playlist:/, "")}`;
  }

  static get client(){
    return client;
  }

  static get available(){
    return !!client;
  }
}

export type exportableSpotify = exportableCustom & {
  artist: string,
};
