import { Worker } from "worker_threads";
import type * as ytsr from "ytsr";
import * as path from "path";
import { type exportableYouTube, YouTube } from ".";
import Util from "../Util";

const worker = new Worker(path.join(__dirname, "./youtube.worker.js")).on("error", () => {});

export type workerMessage = {id:number} & (
  workerInitProcessMessage|workerSearchProcessMessage|workerInitSuccessMessage|workerSearchSuccessMessage|workerErrorMessage|workerLoggingMessage
);
export type workerInitProcessMessage = {
  type:"init",
  url:string,
  prefetched:exportableYouTube,
  forceCache:boolean
};
export type workerSearchProcessMessage = {
  type:"search",
  keyword:string,
}
export type workerInitSuccessMessage = {
  type:"initOk",
  data:YouTube
};
export type workerSearchSuccessMessage = {
  type:"searchOk",
  data:ytsr.Result
}
export type workerErrorMessage = {
  type:"error",
  data:any
};
export type workerLoggingMessage = {
  type:"log",
  level:"log"|"error"|"warn",
  data:string,
}

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
        if(data.type === "error") {
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
  })
}