import type { exportableYouTube } from "..";
import Util from "../../../Util";
import { StreamInfo } from "../../audiosource";
import { youtubeDlStrategy } from "./youtube-dl";
import { ytdlCoreStrategy } from "./ytdl-core";

export type Cache<T extends string, U> = {
  type:T,
  data:U,
};

export abstract class Strategy<T extends Cache<any, any>>{
  constructor(protected priority:number){}
  abstract getInfo(url:string):Promise<{
    data:exportableYouTube,
    cache:T,
  }>;
  abstract fetch(url:string, forceCache?:boolean, cache?:Cache<any, any>):Promise<{
    stream:StreamInfo,
    info:exportableYouTube,
    relatedVideos:exportableYouTube[],
  }>;
  protected useLog(){
    Util.logger.log("[AudioSource:youtube] using strategy #" + this.priority);
  }
}

export const strategies = [ytdlCoreStrategy, youtubeDlStrategy].map((proto, i) => new proto(i));

export async function attemptFetchForStrategies<T extends Cache<string, any>>(...parameters:Parameters<Strategy<T>["fetch"]>){
  for(let i = 0; i < strategies.length; i++){
    try{
      const result = await strategies[i].fetch(...parameters);
      return {
        result, 
        resolved:i,
      }
    }
    catch(e){
      Util.logger.log(`[AudioSource:youtube] fetch in strategy#${i} failed: ${e}`, "error");
      Util.logger.log((i + 1) === strategies.length ? "All strategies failed" : "Fallbacking to the next strategy", "warn");
    }
  }
  throw new Error("All strategies failed");
}

export async function attemptGetInfoForStrategies<T extends Cache<string, any>>(...parameters:Parameters<Strategy<T>["getInfo"]>){
  for(let i = 0; i < strategies.length; i++){
    try{
      const result = await strategies[i].getInfo(...parameters);
      return {
        result,
        resolved: i
      };
    }
    catch(e){
      Util.logger.log(`[AudioSource:youtube] getInfo in strategy#${i} failed: ${e}`, "error");
      Util.logger.log((i + 1) === strategies.length ? "All strategies failed" : "Fallbacking to the next strategy", "warn");
    }
  }
  throw new Error("All strategies failed");
}
