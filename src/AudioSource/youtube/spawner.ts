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

import type { LogLevels } from "../../Util/log";
import type * as ytsr from "ytsr";

import * as path from "path";
import { Worker, isMainThread } from "worker_threads";

import PQueue from "p-queue";

import { type exportableYouTube, YouTube } from "..";
import Util from "../../Util";

const worker = isMainThread
  ? new Worker(path.join(__dirname, "./worker.js")).on("error", console.error)
  : null;
global.workerThread = worker;

export type WithId<T> = T & { id: string };
export type spawnerJobMessage = spawnerGetInfoMessage | spawnerSearchMessage;
export type spawnerGetInfoMessage = {
  type: "init",
  url: string,
  prefetched: exportableYouTube,
  forceCache: boolean,
};
export type spawnerSearchMessage = {
  type: "search",
  keyword: string,
};
export type workerMessage = workerSuccessMessage | workerErrorMessage | workerLoggingMessage;
export type workerSuccessMessage = workerGetInfoSuccessMessage | workerSearchSuccessMessage;
export type workerGetInfoSuccessMessage = {
  type: "initOk",
  data: YouTube,
};
export type workerSearchSuccessMessage = {
  type: "searchOk",
  data: ytsr.Result,
};
export type workerErrorMessage = {
  type: "error",
  data: any,
};
export type workerLoggingMessage = {
  type: "log",
  level: LogLevels,
  data: string,
};

type jobCallback = (callback: workerMessage & { id: string }) => void;
type jobQueueContent = {
  callback: jobCallback,
  start: number,
};
const jobQueue = worker && new Map<string, jobQueueContent>();

if(worker) {
  worker.unref();
  worker.on("message", (message: WithId<workerMessage>) => {
    if(message.type === "log") {
      Util.logger.log(message.data, message.level);
    }else if(jobQueue.has(message.id)) {
      const { callback, start } = jobQueue.get(message.id);
      Util.logger.log(`[Spawner] Job(${message.id}) Finished (${Date.now() - start}ms)`);
      callback(message);
      jobQueue.delete(message.id);
    }else{
      Util.logger.log(`[Spawner] Invalid message received: ${message}`, "warn");
    }
  });
}

const jobTriggerQueue = new PQueue({
  concurrency: 2,
  intervalCap: 4,
  interval: 12,
});

function doJob(message: spawnerGetInfoMessage): Promise<workerGetInfoSuccessMessage>;
function doJob(message: spawnerSearchMessage): Promise<workerSearchSuccessMessage>;
function doJob(message: spawnerJobMessage): Promise<workerSuccessMessage> {
  const uuid = Util.general.generateUUID();
  Util.logger.log(`[Spawner] Job(${uuid}) Scheduled`);
  return jobTriggerQueue.add(
    () =>
      new Promise((resolve, reject) => {
        worker.postMessage({
          ...message,
          id: uuid,
        });
        Util.logger.log(`[Spawner] Job(${uuid}) Started`);
        jobQueue.set(uuid, {
          start: Date.now(),
          callback: result => {
            if(result.type === "error") {
              reject(result.data);
            }else{
              resolve(result as workerSuccessMessage);
            }
          },
        });
      }),
  );
}

export async function initYouTube(
  url: string,
  prefetched: exportableYouTube,
  forceCache?: boolean,
) {
  const result = await doJob({
    type: "init",
    url,
    prefetched,
    forceCache,
  });
  return Object.assign(new YouTube(), result.data);
}

export async function searchYouTube(keyword: string) {
  const result = await doJob({
    type: "search",
    keyword,
  });
  return result.data;
}
