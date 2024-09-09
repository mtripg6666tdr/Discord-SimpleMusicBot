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

import type { SoundCloudTrackCollection } from "../AudioSource";
import type { SoundcloudTrackV2 } from "soundcloud.ts";

import candyget from "candyget";
import Soundcloud from "soundcloud.ts";

import { getCommandExecutionContext } from ".";
import { SearchBase } from "./search";
import * as Util from "../Util";
import { getConfig } from "../config";
import { DefaultUserAgent } from "../definition";

const config = getConfig();

export default class Searchs extends SearchBase<SoundcloudTrackV2[]> {
  private readonly soundcloud = new Soundcloud();

  constructor() {
    super({
      alias: ["soundcloudを検索", "searchsoundcloud", "searchs", "ses", "ss", "sc", "soundcloud"],
      unlist: false,
      category: "playlist",
      args: [{
        type: "string",
        name: "keyword",
        required: true,
      }],
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: true,
      disabled: config.isDisabledSource("soundcloud"),
      usage: true,
      examples: true,
    });
  }

  protected override async searchContent(query: string) {
    let result: SoundcloudTrackV2[] = [];
    let transformedQuery = query;
    if (query.match(/^https:\/\/soundcloud.com\/[^/]+$/)) {
      // ユーザーの楽曲検索
      const user = await this.soundcloud.users.getV2(query);
      const clientId = await this.soundcloud.api.getClientId();

      transformedQuery = user.username;
      let nextUrl = "";
      let rawResult = await this.soundcloud.api.getV2(`users/${user.id}/tracks`) as SoundCloudTrackCollection;

      // 再帰的にユーザーの投稿した楽曲を取得する
      result.push(...rawResult.collection);
      nextUrl = `${rawResult.next_href}&client_id=${clientId}`;
      while (nextUrl && result.length < 10) {
        rawResult = await candyget.json(nextUrl, {
          headers: {
            "User-Agent": DefaultUserAgent,
          },
        }).then(({ body }) => body as SoundCloudTrackCollection);
        result.push(...rawResult.collection);
        nextUrl = rawResult.next_href
          ? `${rawResult.next_href}&client_id=${clientId}`
          : rawResult.next_href;
      }
    } else {
      // 楽曲検索
      result = (await this.soundcloud.tracks.searchV2({ q: query })).collection;
    }
    if (result.length > 12) result = result.splice(0, 11);
    return {
      result,
      transformedQuery,
    };
  }

  protected override consumer(result: SoundcloudTrackV2[]) {
    const { t } = getCommandExecutionContext();

    return result.map(item => {
      const [min, sec] = Util.time.calcMinSec(Math.floor(item.duration / 1000));
      return {
        url: item.permalink_url,
        title: item.title,
        duration: item.full_duration.toString(),
        thumbnail: item.artwork_url,
        author: item.user.username,
        description: `${t("length")}: ${min}:${sec}, ${t("user")}: ${item.user.username}`,
      };
    });
  }
}
