/*
 * Copyright 2021-2022 mtripg6666tdr
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

import type { workerErrorMessage, workerMessage, workerInitSuccessMessage, workerSearchSuccessMessage, workerLoggingMessage } from "./spawner";

import { parentPort } from "worker_threads";

import * as ytsr from "ytsr";

import { YouTube } from ".";
// DO NOT import unnecessary module preventing from infinite spawned workers.

type WithId<T> = T & {id:number};

parentPort.on("message", (value) => {
  const data = value as workerMessage;
  if(data && data.type === "init"){
    const { id, url, prefetched, forceCache } = data;
    const youtube = new YouTube(/* logger */ (content, level?) => {
      parentPort.postMessage({
        type: "log",
        data: content,
        level,
        id,
      } as WithId<workerLoggingMessage>);
    });
    youtube.init(url, prefetched, forceCache).then(() => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const data = Object.assign({}, youtube);
      delete data.logger;
      parentPort.postMessage({
        type: "initOk",
        data,
        id,
      } as WithId<workerInitSuccessMessage>);
    })
      .catch((er) => {
        parentPort.postMessage({
          type: "error",
          data: er,
          id,
        } as WithId<workerErrorMessage>);
      });
  }else if(data && data.type === "search"){
    const id = data.id;
    ytsr.default(data.keyword, {
      limit: 12,
      gl: "JP",
      hl: "ja"
    }).then((result) => {
      parentPort.postMessage({
        type: "searchOk",
        data: result,
        id
      } as WithId<workerSearchSuccessMessage>);
    })
      .catch((er) => {
        parentPort.postMessage({
          type: "error",
          data: er,
          id
        } as WithId<workerErrorMessage>);
      });
  }
});
