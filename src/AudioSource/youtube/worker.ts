import type { workerErrorMessage, workerMessage, workerInitSuccessMessage, workerSearchSuccessMessage, workerLoggingMessage } from "./spawner";
import { parentPort } from "worker_threads";
import { YouTube } from ".";
import * as ytsr from "ytsr";
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
      const data = Object.assign({}, youtube);
      delete data.logger;
      parentPort.postMessage({
        type: "initOk",
        data,
        id,
      } as WithId<workerInitSuccessMessage>);
    }).catch((er) => {
      parentPort.postMessage({
        type: "error",
        data: er,
        id,
      } as WithId<workerErrorMessage>);
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
      } as WithId<workerSearchSuccessMessage>);
    }).catch((er) => {
      parentPort.postMessage({
        type: "error",
        data: er,
        id
      } as WithId<workerErrorMessage>);
    });
  }
})