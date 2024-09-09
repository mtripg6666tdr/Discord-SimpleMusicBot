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

import type { YouTubeJsonFormat } from "..";
import type * as dYtsr from "@distube/ytsr";
import type * as ytsr from "ytsr";

import * as crypto from "crypto";
import * as path from "path";
import { Worker, isMainThread } from "worker_threads";

import PQueue from "p-queue";

import { YouTube } from "..";
import { stringifyObject } from "../../Util";
import { getLogger } from "../../logger";

const worker = isMainThread ? new Worker(path.join(__dirname, global.BUNDLED && __filename.includes("min") ? "./worker.min.js" : "./worker.js")).on("error", console.error) : null;

if (worker) {
  global.workerThread = worker;
}

const logger = getLogger("Spawner");

export type WithId<T> = T & { id: string };

export type SpawnerJobMessage =
  | SpawnerGetInfoMessage
  | SpawnerSearchMessage
  | SpawnerPurgeCacheMessage
  | SpawnerUpdateConfigMessage;
export type SpawnerGetInfoMessage = {
  type: "init",
  url: string,
  prefetched: YouTubeJsonFormat,
  forceCache: boolean,
};
export type SpawnerSearchMessage = {
  type: "search",
  keyword: string,
};
export type SpawnerPurgeCacheMessage = {
  type: "purgeCache",
};
export type SpawnerUpdateConfigMessage = {
  type: "updateConfig",
  config: string,
};
export type WorkerMessage = WorkerSuccessMessage | WorkerErrorMessage;
export type WorkerSuccessMessage = WorkerGetInfoSuccessMessage | WorkerSearchSuccessMessage;
export type WorkerGetInfoSuccessMessage = {
  type: "initOk",
  data: YouTube,
};
export type WorkerSearchSuccessMessage = {
  type: "searchOk",
  data: ytsr.Result | dYtsr.VideoResult,
};
export type WorkerErrorMessage = {
  type: "error",
  data: any,
};

type jobCallback = (callback: WorkerMessage & { id: string }) => void;
type jobQueueContent = {
  callback: jobCallback,
  start: number,
};
const jobQueue = worker && new Map<string, jobQueueContent>();

if (worker) {
  worker.unref();
  worker.on("message", (message: WithId<WorkerMessage>) => {
    if (jobQueue!.has(message.id)) {
      const { callback, start } = jobQueue!.get(message.id)!;

      logger.debug(`Job(${message.id}) Finished (${Date.now() - start}ms)`);

      callback(message);

      jobQueue!.delete(message.id);
    } else {
      logger.warn(`Invalid message received: ${stringifyObject(message)}`);
    }
  });
}

const jobTriggerQueue = new PQueue({
  concurrency: 2,
  intervalCap: 4,
  interval: 12,
});

function doJob(message: SpawnerGetInfoMessage): Promise<WorkerGetInfoSuccessMessage>;
function doJob(message: SpawnerSearchMessage): Promise<WorkerSearchSuccessMessage>;
function doJob(message: SpawnerJobMessage): Promise<WorkerSuccessMessage> {
  if (!worker) {
    throw new Error("Cannot send send messages from worker thread to itself.");
  }

  const uuid = crypto.randomUUID();
  logger.debug(`Job(${uuid}) Scheduled`);

  return jobTriggerQueue.add(() => new Promise((resolve, reject) => {
    worker.postMessage({
      ...message,
      id: uuid,
    });
    logger.debug(`Job(${uuid}) Started`);
    jobQueue!.set(uuid, {
      start: Date.now(),
      callback: result => {
        if (result.type === "error") {
          reject(result.data);
        } else {
          resolve(result as WorkerSuccessMessage);
        }
      },
    });
  }));
}

export async function initYouTube(url: string, prefetched: YouTubeJsonFormat, forceCache?: boolean) {
  const result = await doJob({
    type: "init",
    url,
    prefetched,
    forceCache: !!forceCache,
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

export function updateStrategyConfiguration(config: string) {
  worker?.postMessage({ type: "updateConfig", config, id: "0" } satisfies WithId<SpawnerUpdateConfigMessage>);
}
