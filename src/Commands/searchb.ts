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

import { SearchBase } from "./search";
import { bestdori, BestdoriApi } from "../AudioSource";

export default class Searchb extends SearchBase<string[]> {
  constructor() {
    super({
      name: "searchb",
      alias: ["seb", "sb"],
      unlist: true,
      shouldDefer: true,
    });
  }

  protected async searchContent(query: string) {
    await BestdoriApi.setupData();
    const keys = Object.keys(bestdori.allsonginfo);
    const q = query.toLowerCase();
    return keys.filter(k => {
      const info = bestdori.allsonginfo[Number(k)];
      if (!info.musicTitle[0]) return false;
      return (
        info.musicTitle[0] + bestdori.allbandinfo[info.bandId].bandName[0]
      )
        .toLowerCase()
        .includes(q);
    });
  }

  protected consumer(items: string[]) {
    return items
      .map(item => ({
        title: bestdori.allsonginfo[Number(item)].musicTitle[0],
        url: BestdoriApi.getAudioPage(Number(item)),
        duration: "0",
        thumbnail: BestdoriApi.getThumbnail(
          Number(item),
          bestdori.allsonginfo[Number(item)].jacketImage[0],
        ),
        author:
          bestdori.allbandinfo[bestdori.allsonginfo[Number(item)].bandId]
            .bandName[0],
        description: `バンド名: ${
          bestdori.allbandinfo[bestdori.allsonginfo[Number(item)].bandId]
            .bandName[0]
        }`,
      }))
      .filter(item => item.title);
  }
}
