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

import ytpl from "ytpl";

import { requireIfAny } from "../../Util";
import { useConfig } from "../../config";
const dYtpl = requireIfAny("ytpl") as typeof import("@distube/ytpl");

const config = useConfig();
const playlistSearchOptions = {
  gl: config.country,
  hl: config.defaultLanguage,
} as const satisfies ytpl.Options;

type GetPlaylistResult = {
  title: string,
  itemCount: number,
  visibility: "public" | "unlisted",
  url: string,
  items: {
    url: string,
    title: string,
    author: string,
    isLive: boolean,
    duration: number,
    durationText: string,
    thumbnail: string | null,
  }[],
};

// eslint-disable-next-line @typescript-eslint/ban-types
export function Playlist(id: string, options: ytpl.Options & Record<string & {}, any> = {}): Promise<GetPlaylistResult> {
  if(dYtpl){
    return dYtpl(id, { ...playlistSearchOptions, ...options }).then(resolveDYtplToResult);
  }

  return ytpl(id, { ...playlistSearchOptions, ...options }).then(resolveYtplToResult);
}

Playlist.validateID = function validateID(url: string){
  return ytpl.validateID(url);
};

Playlist.getPlaylistID = function getPlaylistID(url: string){
  return ytpl.getPlaylistID(url);
};

function resolveYtplToResult(result: ytpl.Result): GetPlaylistResult{
  return {
    title: result.title,
    itemCount: result.estimatedItemCount,
    visibility: result.visibility === "everyone" ? "public" : result.visibility,
    url: result.url,
    items: result.items.map(item => ({
      url: item.url,
      title: item.title,
      author: item.author.name,
      isLive: item.isLive,
      duration: item.durationSec || 0,
      durationText: item.duration || "0",
      thumbnail: item.thumbnails[0]?.url || null,
    })),
  };
}

function resolveDYtplToResult(result: import("@distube/ytpl").result): GetPlaylistResult {
  return {
    title: result.title,
    // @ts-expect-error @distube/ytpl is missing 'estimatedItemCount' typing
    itemCount: result.total_items || result.estimatedItemCount,
    visibility: result.visibility === "everyone" ? "public" : "unlisted",
    url: result.url,
    items: result.items.map(item => ({
      url: item.url,
      title: item.title,
      author: item.author?.name || "unknown",
      // @ts-expect-error @distube/ytpl is missing 'isLive' typing
      isLive: item.isLive,
      duration: item.duration
        ?.split(":")
        .reduce((p, c) => p * 60 + Number(c), 0) || 0,
      durationText: item.duration || "0",
      thumbnail: item.thumbnail,
    })),
  };
}
