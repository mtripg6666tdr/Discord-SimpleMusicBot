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

import type { WithId, spawnerJobMessage, workerMessage } from "./spawner";

import { parentPort } from "worker_threads";

import ytsr from "ytsr";

import { YouTube } from ".";
import { requireIfAny, stringifyObject } from "../../Util";
import { useConfig } from "../../config";

if(!parentPort){
  throw new Error("This file should be run in worker thread.");
}

const dYtsr = requireIfAny("@distube/ytsr") as typeof import("@distube/ytsr");

const config = useConfig();
const searchOptions = {
  limit: 12,
  gl: config.country,
  hl: config.defaultLanguage,
};

parentPort.unref();

function postMessage(message: workerMessage|WithId<workerMessage>){
  parentPort!.postMessage(message);
}

function onMessage(message: WithId<spawnerJobMessage>){
  if(!message){
    return;
  }
  if(message.type === "init"){
    const { id, url, prefetched, forceCache } = message;
    const youtube = new YouTube();
    youtube.init(url, prefetched, null, forceCache)
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
  }else if(message.type === "search"){
    const id = message.id;
    ytsr(message.keyword, searchOptions)
      .then(result => {
        postMessage({
          type: "searchOk",
          data: result,
          id,
        });
      })
      .catch((er) => {
        console.error(er);
        if(dYtsr){
          return dYtsr(message.keyword, searchOptions);
        }else{
          throw er;
        }
      })
      .then(result => {
        if(result){
          postMessage({
            type: "searchOk",
            data: result,
            id,
          });
        }
      })
      .catch((er) => {
        postMessage({
          type: "error",
          data: stringifyObject(er),
          id,
        });
      })
    ;
  }
}

parentPort.on("message", onMessage);
