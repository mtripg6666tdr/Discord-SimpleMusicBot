import type { exportableYouTube } from "..";
import { StreamInfo } from "../../audiosource";

export type Cache<T extends string, U> = {
  type:T,
  data:U,
}

export abstract class Strategy<T extends Cache<any, any>>{
  abstract getInfo(url:string):Promise<{
    data: exportableYouTube,
    cache:T,
  }>;
  abstract fetch(url:string, forceCache?:boolean, cache?:T):Promise<{
    stream:StreamInfo,
    info:exportableYouTube,
    relatedVideos:exportableYouTube[],
  }>;
}
