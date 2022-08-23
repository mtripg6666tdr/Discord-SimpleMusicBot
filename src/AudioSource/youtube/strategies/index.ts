import type { LoggerType } from "../../../Util";
import type { Strategy, Cache } from "./base";

import { playDlStrategy } from "./play-dl";
import { youtubeDlStrategy } from "./youtube-dl";
import { ytdlCoreStrategy } from "./ytdl-core";

export const strategies = [
  ytdlCoreStrategy,
  playDlStrategy,
  youtubeDlStrategy
].map((Proto, i) => new Proto(i));

function setupLogger(logger: LoggerType){
  strategies.forEach(strategy => strategy.logger = logger);
}

export async function attemptFetchForStrategies<T extends Cache<string, U>, U>(logger: LoggerType, ...parameters:Parameters<Strategy<T, U>["fetch"]>){
  setupLogger(logger);
  let checkedStrategy = -1;
  if(parameters[2]){
    checkedStrategy = strategies.findIndex(s => s.cacheType === parameters[2].type);
    if(checkedStrategy >= 0){
      try{
        const result = await strategies[checkedStrategy].fetch(...parameters);
        return {
          result,
          resolved: checkedStrategy,
        };
      }
      catch(e){
        logger(`[AudioSource:youtube] fetch in strategy#${checkedStrategy} failed: ${e}`, "error");
        console.error(e);
      }
    }
  }
  for(let i = 0; i < strategies.length; i++){
    if(i !== checkedStrategy){
      try{
        const result = await strategies[i].fetch(...parameters);
        return {
          result,
          resolved: i,
        };
      }
      catch(e){
        logger(`[AudioSource:youtube] fetch in strategy#${i} failed: ${e}`, "error");
        console.error(e);
      }
    }
    logger((i + 1) === strategies.length ? "[AudioSource:youtube] All strategies failed" : "[AudioSource:youtube] Fallbacking to the next strategy", "warn");
  }
  throw new Error("All strategies failed");
}

export async function attemptGetInfoForStrategies<T extends Cache<string, U>, U>(logger: LoggerType, ...parameters:Parameters<Strategy<T, U>["getInfo"]>){
  setupLogger(logger);
  for(let i = 0; i < strategies.length; i++){
    try{
      const result = await strategies[i].getInfo(...parameters);
      return {
        result,
        resolved: i
      };
    }
    catch(e){
      logger(`[AudioSource:youtube] getInfo in strategy#${i} failed: ${e}`, "error");
      console.error(e);
      logger((i + 1) === strategies.length ? "[AudioSource:youtube] All strategies failed" : "[AudioSource:youtube] Fallbacking to the next strategy", "warn");
    }
  }
  throw new Error("All strategies failed");
}
