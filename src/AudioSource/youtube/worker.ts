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
import type { LogLevels } from "../../Util/log";

import { parentPort } from "worker_threads";

import * as ytsr from "ytsr";

import { YouTube } from ".";
import Util from "../../Util";

parentPort.unref();

function postMessage(message: workerMessage | WithId<workerMessage>) {
  parentPort.postMessage(message);
}

function logger(content: any, loglevel: LogLevels) {
  postMessage({
    type: "log",
    data: content,
    level: loglevel,
  });
}

function onMessage(message: WithId<spawnerJobMessage>) {
  if(!message) {
    return;
  }
  if(message.type === "init") {
    const { id, url, prefetched, forceCache } = message;
    const youtube = new YouTube(/* logger */ logger);
    youtube
      .init(url, prefetched, forceCache)
      .then(() => {
        const data = Object.assign({}, youtube);
        delete data.logger;
        postMessage({
          type: "initOk",
          data,
          id,
        });
      })
      .catch(er => {
        postMessage({
          type: "error",
          data: Util.general.StringifyObject(er),
          id,
        });
      });
  }else if(message.type === "search") {
    const id = message.id;
    ytsr
      .default(message.keyword, {
        limit: 12,
        gl: "JP",
        hl: "ja",
      })
      .then(result => {
        postMessage({
          type: "searchOk",
          data: result,
          id,
        });
      })
      .catch(er => {
        postMessage({
          type: "error",
          data: Util.general.StringifyObject(er),
          id,
        });
      });
  }
}

parentPort.on("message", onMessage);
