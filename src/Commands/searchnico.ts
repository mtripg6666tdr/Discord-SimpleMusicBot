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

import type { SongInfo } from "../Component/searchPanel";

import candyget from "candyget";

import { getCommandExecutionContext } from ".";
import { SearchBase } from "./search";
import { time } from "../Util";
import { getConfig } from "../config";


const config = getConfig();

export default class SearchN extends SearchBase<Datum[]> {
  constructor() {
    super({
      alias: ["ニコニコを検索", "ニコ動を検索", "searchnico", "searchniconico", "searchn"],
      unlist: false,
      category: "playlist",
      args: [
        {
          type: "string",
          name: "keyword",
          required: true,
        },
      ],
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: true,
      disabled: config.isDisabledSource("niconico"),
      usage: true,
      examples: true,
    });
  }

  protected override searchContent(query: string) {
    return searchNicoNico(query);
  }

  protected override consumer(result: Datum[]): SongInfo[] {
    const { t } = getCommandExecutionContext();

    return result.map(item => {
      const [min, sec] = time.calcMinSec(Math.floor(item.lengthSeconds));
      return {
        url: `https://www.nicovideo.jp/watch/${item.contentId}`,
        title: item.title,
        duration: `${min}:${sec}`,
        thumbnail: item.thumbnailUrl,
        author: `${t("audioSources.playCountLabel")} ${t("audioSources.playCount", { count: item.viewCounter })}`,
        description: `${t("length")}: ${min}:${sec}`,
      };
    });
  }
}

const API_ENDPOINT = "https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search";

async function searchNicoNico(keyword: string){
  const url = `${API_ENDPOINT}?q=${encodeURIComponent(keyword)}&targets=title,description,tags&fields=contentId,title,lengthSeconds,thumbnailUrl,viewCounter&_sort=-viewCounter`;
  const result = await candyget.json(url, {
    validator(responseBody): responseBody is SearchResult {
      return responseBody.data && Array.isArray(responseBody.data) && responseBody.meta.status === 200;
    },
  });
  return result.body.data;
}

interface SearchResult {
  data: Datum[];
  meta: Meta;
}

interface Datum {
  contentId: string;
  title: string;
  thumbnailUrl: string;
  lengthSeconds: number;
  viewCounter: number;
}

interface Meta {
  id: string;
  totalCount: number;
  status: number;
}
