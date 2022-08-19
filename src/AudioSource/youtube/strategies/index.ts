import { Strategy, Cache } from "./base";
import Util from "../../../Util";
import { youtubeDlStrategy } from "./youtube-dl";
import { ytdlCoreStrategy } from "./ytdl-core";

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
