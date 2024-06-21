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

import type { BestdoriAllBandInfo, BestdoriAllSongInfo } from "../AudioSource";

import { SearchBase } from "./search";
import { BestdoriApi } from "../AudioSource";

export default class Searchb extends SearchBase<string[]> {
  private songInfoCache: BestdoriAllSongInfo = null!;
  private bandInfoCache: BestdoriAllBandInfo = null!;

  constructor(){
    super({
      name: "searchb",
      alias: ["seb", "sb"],
      unlist: true,
      shouldDefer: true,
      disabled: !process.env.BD_ENABLE,
    });
  }

  protected async searchContent(query: string){
    this.songInfoCache = await BestdoriApi.instance.getSongInfo();
    this.bandInfoCache = await BestdoriApi.instance.getBandInfo();
    const keys = Object.keys(this.songInfoCache);
    const q = query.toLowerCase();
    return keys.filter(k => {
      const info = this.songInfoCache[Number(k)];
      if(!info.musicTitle[0]) return false;
      return (info.musicTitle[0] + this.bandInfoCache[info.bandId].bandName[0]).toLowerCase().includes(q);
    });
  }

  protected consumer(items: string[]){
    return items.map(item => ({
      title: this.songInfoCache[Number(item)].musicTitle[0],
      url: BestdoriApi.instance.getAudioPage(Number(item)),
      duration: String.fromCharCode(0x200b),
      thumbnail: BestdoriApi.instance.getThumbnailUrl(Number(item), this.songInfoCache[Number(item)].jacketImage[0]),
      author: this.bandInfoCache[this.songInfoCache[Number(item)].bandId].bandName[0],
      description: `バンド名: ${this.bandInfoCache[this.songInfoCache[Number(item)].bandId].bandName[0]}`,
    })).filter(item => item.title);
  }
}
