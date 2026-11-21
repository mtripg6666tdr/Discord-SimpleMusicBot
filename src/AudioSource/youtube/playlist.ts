/*
 * Copyright 2021-2025 mtripg6666tdr
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

import type { PlaylistInfo } from "./ytdlCore";

import { formatDuration, getPlaylist, resolvePlaylistTarget } from "./ytdlCore";

export type PlaylistOptions = {
  limit?: number,
  // Accepted for compatibility with the previous @distube/ytpl-based
  // implementation, but no longer used: @distube/ytdl-core v5 only supports
  // a region (set globally via the config) and returns English metadata.
  gl?: string,
  hl?: string,
};

type GetPlaylistResult = {
  title: string,
  itemCount: number,
  visibility: "public" | "unlisted",
  thumbnailUrl: string | null,
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

export function Playlist(id: string, options: PlaylistOptions & Record<string & {}, any> = {}): Promise<GetPlaylistResult> {
  return getPlaylist(id, { limit: options.limit }).then(resolveToResult);
}

Playlist.validateID = function validateID(url: string) {
  return resolvePlaylistTarget(url) !== undefined;
};

Playlist.getPlaylistID = function getPlaylistID(url: string) {
  const target = resolvePlaylistTarget(url);
  if (target === undefined) {
    throw new Error("Failed to extract the playlist ID.");
  }

  return target;
};

function resolveToResult(result: PlaylistInfo): GetPlaylistResult {
  return {
    title: result.title || "",
    itemCount: result.videoCount ?? result.videos.length,
    // @distube/ytdl-core v5 does not expose the visibility of a playlist;
    // report it as public, as with most playlists.
    visibility: "public",
    url: result.url,
    thumbnailUrl: result.thumbnails[0]?.url ?? null,
    items: result.videos.map(item => ({
      url: item.url,
      title: item.title,
      author: item.author.name || "unknown",
      isLive: item.isLive,
      duration: item.lengthSeconds ?? 0,
      durationText: formatDuration(item.lengthSeconds),
      thumbnail: item.thumbnails[0]?.url ?? null,
    })),
  };
}
