import type { workerErrorMessage, workerMessage, workerInitSuccessMessage } from "./youtube.spawner";
import { parentPort } from "worker_threads";
import { YouTube } from "./youtube";
import * as ytsr from "ytsr";
import { workerSearchSuccessMessage } from ".";

parentPort.on("message", (value) => {
  const data = value as workerMessage;
  if(data && data.type === "init"){
    const { id, url, prefetched, forceCache } = data;
    const youtube = new YouTube();
    youtube.init(url, prefetched, forceCache).then(() => {
      parentPort.postMessage({
        type: "initOk",
        data: youtube,
        id,
      } as workerInitSuccessMessage & {type:number});
    }).catch((er) => {
      parentPort.postMessage({
        type: "error",
        data: er,
        id,
      } as workerErrorMessage & {type:number});
    });
  }else if(data && data.type === "search"){
    const id = data.id;
    ytsr.default(data.keyword, {
      limit:12,
      gl: "JP",
      hl: "ja"
    }).then((result) => {
      parentPort.postMessage({
        type: "searchOk",
        data: result,
        id
      } as workerSearchSuccessMessage & {type:number})
    }).catch((er) => {
      parentPort.postMessage({
        type: "error",
        data: er,
        id
      } as workerErrorMessage & {type:number});
    });
  }
})