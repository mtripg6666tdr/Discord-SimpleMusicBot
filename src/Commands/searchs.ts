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

import type { SoundCloudTrackCollection } from "../AudioSource";
import type { SoundcloudTrackV2 } from "soundcloud.ts";

import Soundcloud from "soundcloud.ts";

import { SearchBase } from "./search";
import { Util } from "../Util";

const {DefaultUserAgent} = Util.ua;

export default class Searchs extends SearchBase<SoundcloudTrackV2[]> {
  private readonly soundcloud = new Soundcloud();

  constructor() {
    super({
      name: "サウンドクラウドを検索",
      alias: [
        "soundcloudを検索",
        "searchsoundcloud",
        "searchs",
        "ses",
        "ss",
        "sc",
        "soundcloud",
      ],
      description: "曲をSoundCloudで検索します",
      unlist: false,
      category: "playlist",
      examples: "ses sakura trip",
      usage: "ses <キーワード>",
      argument: [
        {
          type: "string",
          name: "keyword",
          description: "検索したい楽曲のキーワードまたはURL。",
          required: true,
        },
      ],
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: true,
    });
  }

  protected override async searchContent(query: string) {
    let result: SoundcloudTrackV2[] = [];
    let transformedQuery = query;
    if (query.match(/^https:\/\/soundcloud.com\/[^/]+$/)) {
      // ユーザーの楽曲検索
      const user = await this.soundcloud.users.getV2(query);
      transformedQuery = user.username;
      let nextUrl = "";
      let rawResult = (await this.soundcloud.api.getV2(
        "users/" + user.id + "/tracks",
      )) as SoundCloudTrackCollection;
      result.push(...rawResult.collection);
      nextUrl =
        rawResult.next_href +
        "&client_id=" +
        (await this.soundcloud.api.getClientID());
      while (nextUrl && result.length < 10) {
        const data = await Util.web.DownloadText(nextUrl, {
          "User-Agent": DefaultUserAgent,
        });
        rawResult = JSON.parse(data) as SoundCloudTrackCollection;
        result.push(...rawResult.collection);
        nextUrl = rawResult.next_href
          ? rawResult.next_href +
            "&client_id=" +
            (await this.soundcloud.api.getClientID())
          : rawResult.next_href;
      }
    } else {
      // 楽曲検索
      result = (await this.soundcloud.tracks.searchV2({q: query})).collection;
    }
    if (result.length > 12) result = result.splice(0, 11);
    return {
      result,
      transformedQuery,
    };
  }

  protected override consumer(result: SoundcloudTrackV2[]) {
    return result.map(item => {
      const [min, sec] = Util.time.CalcMinSec(Math.floor(item.duration / 1000));
      return {
        url: item.permalink_url,
        title: item.title,
        duration: item.full_duration.toString(),
        thumbnail: item.artwork_url,
        author: item.user.username,
        description: `長さ: ${min}:${sec}, ユーザー: ${item.user.username}`,
      };
    });
  }
}
