import { LoggerType } from "../../../Util";
import { Strategy, Cache } from "./base";
import { youtubeDlStrategy } from "./youtube-dl";
import { ytdlCoreStrategy } from "./ytdl-core";

export const strategies = [ytdlCoreStrategy, youtubeDlStrategy].map((proto, i) => new proto(i));

function setupLogger(logger: LoggerType){
  strategies.forEach(strategy => strategy.logger = logger);
}

export async function attemptFetchForStrategies<T extends Cache<string, any>>(logger: LoggerType, ...parameters:Parameters<Strategy<T>["fetch"]>){
  setupLogger(logger);
  for(let i = 0; i < strategies.length; i++){
    try{
      const result = await strategies[i].fetch(...parameters);
      return {
        result, 
        resolved:i,
      }
    }
    catch(e){
      logger(`[AudioSource:youtube] fetch in strategy#${i} failed: ${e}`, "error");
      logger((i + 1) === strategies.length ? "All strategies failed" : "Fallbacking to the next strategy", "warn");
    }
  }
  throw new Error("All strategies failed");
}

export async function attemptGetInfoForStrategies<T extends Cache<string, any>>(logger: LoggerType, ...parameters:Parameters<Strategy<T>["getInfo"]>){
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
      logger((i + 1) === strategies.length ? "All strategies failed" : "Fallbacking to the next strategy", "warn");
    }
  }
  throw new Error("All strategies failed");
}
