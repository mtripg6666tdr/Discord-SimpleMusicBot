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

import type { WithId, SpawnerGetInfoMessage, SpawnerJobMessage, SpawnerSearchMessage, WorkerMessage, SpawnerPurgeCacheMessage } from "./spawner";

import "../../polyfill";

import { parentPort } from "worker_threads";

import dYtdl from "@distube/ytdl-core";
import ytdl from "ytdl-core";
import ytsr from "ytsr";

import { YouTube } from ".";
import { requireIfAny, stringifyObject } from "../../Util";
import { getConfig } from "../../config";

const dYtsr = requireIfAny("@distube/ytsr") as typeof import("@distube/ytsr");

if(!parentPort){
  throw new Error("This file should be run in worker thread.");
}

const config = getConfig();
const searchOptions = {
  limit: 12,
  gl: config.country,
  hl: config.defaultLanguage,
};

parentPort.unref();
parentPort.on("message", onMessage);

function postMessage(message: WorkerMessage | WithId<WorkerMessage>){
  parentPort!.postMessage(message);
}

function getInfo({ id, url, prefetched, forceCache }: WithId<SpawnerGetInfoMessage>){
  const youtube = new YouTube();
  youtube.init(url, prefetched, forceCache)
    .then(() => {
      const data = Object.assign({}, youtube);
      // @ts-expect-error
      delete data["logger"];
      postMessage({
        type: "initOk",
        data,
        id,
      });
    })
    .catch((er) => {
      postMessage({
        type: "error",
        data: stringifyObject(er),
        id,
      });
    });
}

function search({ id, keyword }: WithId<SpawnerSearchMessage>){
  if(dYtsr){
    dYtsr(keyword, searchOptions)
    // @ts-ignore
      .then(result => {
        postMessage({
          type: "searchOk",
          data: result,
          id,
        });
      })
      // @ts-ignore
      .catch((err) => {
        console.error(err);

        return ytsr(keyword, searchOptions);
      })
      // @ts-ignore
      .catch(err => {
        postMessage({
          type: "error",
          data: stringifyObject(err),
          id,
        });
      });
  }

  ytsr(keyword, searchOptions)
    .then(result => {
      postMessage({
        type: "searchOk",
        data: result,
        id,
      });
    })
    .catch((err) => {
      postMessage({
        type: "error",
        data: stringifyObject(err),
        id,
      });
    });
}

function purgeCache(_: WithId<SpawnerPurgeCacheMessage>){
  const extractCacheOtherThanCookie = (module: typeof ytdl | typeof dYtdl | null) => {
    if(!module){
      return [];
    }

    // @ts-expect-error
    const cache: { [key: string]: Map<string, unknown> } = module.cache;
    return Object.entries(cache)
      .filter(([key]) => key !== "cookie")
      .map(([, value]) => value);
  };

  extractCacheOtherThanCookie(ytdl).forEach(cache => cache.clear());
  extractCacheOtherThanCookie(dYtdl).forEach(cache => cache.clear());
}

function onMessage(message: WithId<SpawnerJobMessage>){
  if(!message){
    return;
  }

  switch(message.type){
    case "init":
      getInfo(message);
      break;
    case "search":
      search(message);
      break;
    case "purgeCache":
      purgeCache(message);
      break;
  }
}
