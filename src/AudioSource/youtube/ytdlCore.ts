/*
 * Copyright 2021-2026 mtripg6666tdr
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

import type { DownloadOptions, PlaylistInfo, VideoInfo } from "@distube/ytdl-core" with { "resolution-mode": "import" };
import type { Readable } from "stream";

import { fetch as undiciFetch, ProxyAgent } from "undici";

import { getConfig } from "../../config";
import { getLogger } from "../../logger";

export type { DownloadOptions, PlaylistInfo, VideoFormat, VideoInfo } from "@distube/ytdl-core" with { "resolution-mode": "import" };

const logger = getLogger("DistubeYtdlCore");
const config = getConfig();

export type YtdlCoreModule = typeof import("@distube/ytdl-core", { with: { "resolution-mode": "import" } });
export type YtdlInstance = InstanceType<YtdlCoreModule["Ytdl"]>;

// @distube/ytdl-core v5 is an ESM-only package, while this project is compiled
// to CommonJS, where TypeScript transpiles a plain import() expression into a
// require() call. Go through the Function constructor to keep a native
// dynamic import() at runtime.
// eslint-disable-next-line no-new-func
const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<YtdlCoreModule>;

let modulePromise: Promise<YtdlCoreModule> | null = null;

/** Loads the @distube/ytdl-core module (memoized). */
export function loadYtdlCore(): Promise<YtdlCoreModule> {
  modulePromise ??= dynamicImport("@distube/ytdl-core");
  return modulePromise;
}

let instancePromise: Promise<YtdlInstance> | null = null;

/** Returns the shared Ytdl instance (memoized), honoring the configured proxy and country. */
export function getYtdlInstance(): Promise<YtdlInstance> {
  instancePromise ??= (async () => {
    const { Ytdl } = await loadYtdlCore();
    logger.debug("Creating a Ytdl instance");
    return new Ytdl({
      country: config.country,
      fetch: config.proxy ? createProxyFetch(config.proxy) : undefined,
    });
  })();
  return instancePromise;
}

function createProxyFetch(proxy: string): typeof fetch {
  const dispatcher = new ProxyAgent(proxy);
  return ((url: string | URL | Request, init?: RequestInit) => undiciFetch(url as any, {
    ...init,
    dispatcher,
  } as any)) as unknown as typeof fetch;
}

/** Fetches the video information of the given video URL or ID. */
export async function getInfo(url: string): Promise<VideoInfo> {
  const ytdl = await getYtdlInstance();
  return ytdl.getInfo(url);
}

/** Downloads the given format of the previously fetched video information as a readable stream. */
export async function download(info: VideoInfo, options: DownloadOptions): Promise<Readable> {
  const ytdl = await getYtdlInstance();
  return ytdl.download(info, options);
}

/** Fetches the playlist (or a channel's uploads) of the given ID or URL. */
export async function getPlaylist(target: string, options: { limit?: number } = {}): Promise<PlaylistInfo> {
  const ytdl = await getYtdlInstance();
  return ytdl.getPlaylist(target, { limit: options.limit });
}

/**
 * A search result item, shaped after the items @distube/ytsr used to return,
 * so that existing consumers can keep using the same fields.
 */
export interface YouTubeSearchVideoItem {
  type: "video";
  id: string;
  url: string;
  title: string;
  name: string;
  duration: string;
  thumbnail: string | null;
  bestThumbnail: { url: string } | null;
  author: {
    name: string,
    url: string | undefined,
    verified: boolean,
    ownerBadges: string[],
  };
  isLive: boolean;
  views: number | undefined;
}

export interface YouTubeSearchResult {
  items: YouTubeSearchVideoItem[];
}

/** Formats a length in seconds as `m:ss` (or `h:mm:ss`). */
export function formatDuration(totalSeconds: number | undefined): string {
  if (totalSeconds === undefined) {
    return "0";
  }

  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Searches for videos and returns the results in the legacy ytsr-like shape. */
export async function searchVideos(query: string, limit = 12): Promise<YouTubeSearchResult> {
  const ytdl = await getYtdlInstance();
  const videos = await ytdl.search(query, { limit });
  return {
    items: videos.map(video => {
      const thumbnail = video.thumbnails[video.thumbnails.length - 1]?.url ?? null;
      return {
        type: "video",
        id: video.id,
        url: video.url,
        title: video.title,
        name: video.title,
        duration: video.isLive ? "Live" : formatDuration(video.lengthSeconds),
        thumbnail,
        bestThumbnail: thumbnail ? { url: thumbnail } : null,
        author: {
          name: video.author.name || "",
          url: video.author.url,
          verified: !!video.author.verified,
          ownerBadges: [...video.author.badges],
        },
        isLive: video.isLive,
        views: video.viewCount,
      };
    }),
  };
}

// The URL parsers below mirror the semantics of parseVideoId /
// parsePlaylistId / getPlaylistTarget of @distube/ytdl-core v5, so that they
// can be used synchronously before the ESM module is loaded.

const videoIdPattern = /^[\w-]{11}$/;
const playlistIdPattern = /^(?!RD(?!CLAK5uy_))(?!UC[\w-]{22}$)[\w-]{12,64}$/;
const channelIdPattern = /^UC[\w-]{22}$/;
const youtubeHosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "gaming.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const videoPathPrefixes = ["/shorts/", "/embed/", "/live/", "/v/", "/e/"];
const embedPlayerIds = new Set(["videoseries", "live_stream"]);

function toYouTubeUrl(text: string): URL | undefined {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return undefined;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return undefined;
  }

  const host = url.hostname.toLowerCase();
  return host === "youtu.be" || youtubeHosts.has(host) ? url : undefined;
}

/** Extracts the 11-character video ID from a bare ID or a YouTube video URL, mirroring parseVideoId of @distube/ytdl-core. */
export function parseVideoId(input: string): string | undefined {
  const text = input.trim();
  if (videoIdPattern.test(text)) {
    return text;
  }

  const url = toYouTubeUrl(text);
  if (!url) {
    return undefined;
  }

  let candidate: string | undefined;
  if (url.hostname.toLowerCase() === "youtu.be") {
    candidate = url.pathname.split("/")[1];
  } else if (url.pathname === "/watch") {
    candidate = url.searchParams.get("v") ?? undefined;
  } else {
    const prefix = videoPathPrefixes.find(p => url.pathname.startsWith(p));
    if (prefix) {
      candidate = url.pathname.slice(prefix.length).split("/")[0];
    }
  }

  return candidate !== undefined && videoIdPattern.test(candidate) && !embedPlayerIds.has(candidate) ? candidate : undefined;
}

/** Extracts the playlist ID from a bare ID or a YouTube URL, mirroring parsePlaylistId of @distube/ytdl-core. */
export function parsePlaylistId(input: string): string | undefined {
  const text = typeof input === "string" ? input.trim() : "";
  const id = playlistIdPattern.test(text) ? text : toYouTubeUrl(text)?.searchParams.get("list");
  return id && playlistIdPattern.test(id) ? id : undefined;
}

/**
 * Resolves the input to a target that getPlaylist accepts: a playlist ID, a
 * channel's uploads playlist ID, or a channel page URL. Mirrors
 * getPlaylistTarget of @distube/ytdl-core (and the channel handling the
 * previous @distube/ytpl-based implementation had).
 */
export function resolvePlaylistTarget(input: string): string | undefined {
  const id = parsePlaylistId(input);
  if (id !== undefined) {
    return id;
  }

  const text = typeof input === "string" ? input.trim() : "";
  if (channelIdPattern.test(text)) {
    return `UU${text.slice(2)}`;
  }

  const url = toYouTubeUrl(text);
  if (url && url.hostname.toLowerCase() !== "youtu.be") {
    const page = /^(?<channel>\/(?:channel\/(?<id>UC[\w-]{22})|@[^/]+|c\/[^/]+|user\/[^/]+))(?:\/videos|\/featured)?\/?$/.exec(url.pathname);
    if (page) {
      const { channel, id: channelId } = page.groups ?? {};
      return channelId ? `UU${channelId.slice(2)}` : `https://www.youtube.com${channel}`;
    }
  }

  return undefined;
}

/** Whether the given string is a valid video ID. */
export function validateID(id: string): boolean {
  return videoIdPattern.test(id);
}

/** Whether the given string is a valid YouTube video URL. */
export function validateURL(url: string): boolean {
  return /^https?:\/\//i.test(url.trim()) && parseVideoId(url) !== undefined;
}

/** Extracts the video ID from the given URL, throwing when it cannot be extracted. */
export function getVideoID(url: string): string {
  const id = parseVideoId(url);
  if (!id) {
    throw new Error(`Failed to extract the video ID from the URL: ${url}`);
  }

  return id;
}
