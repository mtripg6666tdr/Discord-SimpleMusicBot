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

import type * as ytsr from "ytsr";

import * as path from "path";
import { Worker, isMainThread } from "worker_threads";

import { type exportableYouTube, YouTube } from "..";
import Util from "../../Util";

const worker = isMainThread && new Worker(path.join(__dirname, "./worker.js")).on("error", () => {});

export type workerMessage = {id:number} & (
  workerInitProcessMessage|workerSearchProcessMessage|workerInitSuccessMessage|workerSearchSuccessMessage|workerErrorMessage|workerLoggingMessage
);
export type workerInitProcessMessage = {
  type:"init",
  url:string,
  prefetched:exportableYouTube,
  forceCache:boolean,
};
export type workerSearchProcessMessage = {
  type:"search",
  keyword:string,
};
export type workerInitSuccessMessage = {
  type:"initOk",
  data:YouTube,
};
export type workerSearchSuccessMessage = {
  type:"searchOk",
  data:ytsr.Result,
};
export type workerErrorMessage = {
  type:"error",
  data:any,
};
export type workerLoggingMessage = {
  type:"log",
  level:"log"|"error"|"warn",
  data:string,
};

export function initYouTube(url:string, prefetched:exportableYouTube, forceCache?:boolean){
  return new Promise<YouTube>((resolve, reject) => {
    const id = (new Date()).getTime() * Math.random();
    worker.postMessage({
      type: "init",
      url, prefetched, forceCache, id
    } as workerInitProcessMessage);
    const resolveHandler = (data:workerMessage) => {
      if(data.id === id){
        if(data.type === "log"){
          Util.logger.log(data.data, data.level);
          return;
        }
        if(data.type === "error"){
          reject(data.data);
        }else if(data.type === "initOk"){
          resolve(Object.assign(new YouTube(), data.data));
        }
        worker.off("message", resolveHandler);
      }
    };
    worker.addListener("message", resolveHandler);
  });
}

export function searchYouTube(keyword:string){
  return new Promise<ytsr.Result>((resolve, reject) => {
    const id = (new Date()).getTime() * Math.random();
    worker.postMessage({
      type: "search", keyword, id
    } as workerSearchProcessMessage);
    const resolveHandler = (data:workerMessage) => {
      if(data.id === id){
        if(data.type === "error"){
          reject(data.data);
        }else if(data.type === "searchOk"){
          resolve(data.data);
        }
        worker.off("message", resolveHandler);
      }
    };
    worker.addListener("message", resolveHandler);
  });
}
