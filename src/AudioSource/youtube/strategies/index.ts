/*
 * Copyright 2021-2023 mtripg6666tdr
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

import type { Strategy, Cache } from "./base";
import type { playDlStrategy } from "./play-dl";
import type { youtubeDlStrategy } from "./youtube-dl";
import type { ytDlPStrategy } from "./yt-dlp";
import type { ytdlCoreStrategy } from "./ytdl-core";
import type { YtDlPatchedYoutubeDl } from "./ytdl-patched_youtube-dl";

import { useConfig } from "../../../config";
import { getLogger } from "../../../logger";

type strategies =
  | ytdlCoreStrategy
  | playDlStrategy
  | youtubeDlStrategy
  | ytDlPStrategy
  | YtDlPatchedYoutubeDl
;

const logger = getLogger("Strategies");
const config = useConfig();

export const strategies: strategies[] = [
  () => require("./ytdl-core"),
  () => require("./play-dl"),
  () => require("./youtube-dl"),
  () => require("./yt-dlp"),
  () => require("./ytdl-patched_youtube-dl"),
].map((_import, i) => {
  try{
    const { default: Module } = _import();
    return new Module(i);
  }
  catch(e){
    logger.warn(`failed to load strategy#${i}`);
    if(config.debug){
      logger.debug(e);
    }
    return null;
  }
});

export async function attemptFetchForStrategies<T extends Cache<string, U>, U>(...parameters: Parameters<Strategy<T, U>["fetch"]>){
  let checkedStrategy = -1;
  if(parameters[2]){
    const cacheType = parameters[2].type;
    checkedStrategy = strategies.findIndex(s => s && s.cacheType === cacheType);
    if(checkedStrategy >= 0){
      try{
        const result = await strategies[checkedStrategy].fetch(...parameters);
        return {
          result,
          resolved: checkedStrategy,
          cache: result.cache,
        };
      }
      catch(e){
        logger.warn(`fetch in strategy#${checkedStrategy} failed`, e);
      }
    }
  }
  for(let i = 0; i < strategies.length; i++){
    if(i !== checkedStrategy && strategies[i]){
      try{
        const result = await strategies[i].fetch(...parameters);
        return {
          result,
          resolved: i,
          cache: result.cache,
        };
      }
      catch(e){
        logger.warn(`fetch in strategy#${i} failed`, e);
      }
    }
    logger.warn(
      i + 1 === strategies.length
        ? "All strategies failed"
        : "Fallbacking to the next strategy"
    );
  }
  throw new Error("All strategies failed");
}

export async function attemptGetInfoForStrategies<T extends Cache<string, U>, U>(...parameters: Parameters<Strategy<T, U>["getInfo"]>){
  for(let i = 0; i < strategies.length; i++){
    try{
      if(strategies[i]){
        const result = await strategies[i].getInfo(...parameters);
        return {
          result,
          resolved: i,
        };
      }
    }
    catch(e){
      logger.warn(`getInfo in strategy#${i} failed`, e);
      logger.warn(
        i + 1 === strategies.length
          ? "All strategies failed"
          : "Fallbacking to the next strategy"
      );
    }
  }
  throw new Error("All strategies failed");
}
