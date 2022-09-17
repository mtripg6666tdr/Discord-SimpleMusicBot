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

import type { LoggerType } from "../../../Util";
import type { Strategy, Cache } from "./base";
import type { playDlStrategy } from "./play-dl";
import type { youtubeDlStrategy } from "./youtube-dl";
import type { ytdlCoreStrategy } from "./ytdl-core";

import { Util } from "../../../Util";

type strategies =
  | ytdlCoreStrategy
  | youtubeDlStrategy
  | playDlStrategy
;

export const strategies:strategies[] = [
  "./ytdl-core",
  "./play-dl",
  "./youtube-dl",
].map((path, i) => {
  try{
    const { default: Module } = require(path);
    return new Module(i);
  }
  catch(e){
    Util.logger.log(e, "error");
    Util.logger.log(`[AudioSource:youtube] failed to load strategy#${i}`, "warn");
    return null;
  }
}).filter(mod => !!mod);

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
        logger(e, "error");
        logger(`[AudioSource:youtube] fetch in strategy#${checkedStrategy} failed: ${e}`, "warn");
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
        logger(e, "error");
        logger(`[AudioSource:youtube] fetch in strategy#${i} failed: ${e}`, "warn");
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
      logger(e, "error");
      logger(`[AudioSource:youtube] getInfo in strategy#${i} failed: ${e}`, "warn");
      logger((i + 1) === strategies.length ? "[AudioSource:youtube] All strategies failed" : "[AudioSource:youtube] Fallbacking to the next strategy", "warn");
    }
  }
  throw new Error("All strategies failed");
}
