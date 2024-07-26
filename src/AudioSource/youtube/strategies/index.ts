/*
 * Copyright 2021-2024 mtripg6666tdr
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
import type { NightlyYoutubeDl } from "./nightly_youtube-dl";
import type { playDlStrategy } from "./play-dl";
import type { youtubeDlStrategy } from "./youtube-dl";
import type { ytDlPStrategy } from "./yt-dlp";
import type { ytdlCoreStrategy } from "./ytdl-core";

import { getConfig } from "../../../config";
import { getLogger } from "../../../logger";


interface StrategyImporter {
  enable: boolean;
  importer: () => any;
  isFallback: boolean;
}

interface Strategies {
  module:
    | ytdlCoreStrategy
    | playDlStrategy
    | youtubeDlStrategy
    | ytDlPStrategy
    | NightlyYoutubeDl;
  isFallback: boolean;
}

const logger = getLogger("Strategies");
const config = getConfig();

const strategyImporters: StrategyImporter[] = [
  { enable: false, isFallback: false, importer: () => require("./ytdl-core") },
  { enable: false, isFallback: false, importer: () => require("./play-dl") },
  { enable: true, isFallback: false, importer: () => require("./distube_ytdl-core") },
  { enable: true, isFallback: false, importer: () => require("./play-dl-test") },
  { enable: false, isFallback: true, importer: () => require("./youtube-dl") },
  { enable: true, isFallback: true, importer: () => require("./yt-dlp") },
  { enable: true, isFallback: true, importer: () => require("./nightly_youtube-dl") },
] as const;

export let strategies: (Strategies | null)[] = [];

function initStrategies(configEnabled: boolean[] | null = null){
  strategies = strategyImporters.map(({ enable, importer, isFallback }, i) => {
    if(Array.isArray(configEnabled) ? !configEnabled[i] : !enable){
      logger.warn(`strategy#${i} is currently disabled.`);
      return null;
    }

    try{
      const { default: Module } = importer();
      return {
        module: new Module(i),
        isFallback,
      };
    }
    catch(e){
      logger.warn(`failed to load strategy#${i}`);
      if(config.debug){
        logger.debug(e);
      }
      return null;
    }
  });
}

initStrategies();

export async function attemptFetchForStrategies<T extends Cache<string, U>, U>(...parameters: Parameters<Strategy<T, U>["fetch"]>){
  let checkedStrategy = -1;
  if(parameters[2]){
    const cacheType = parameters[2].type;
    checkedStrategy = strategies.findIndex(s => s && s.module.cacheType === cacheType);
    if(checkedStrategy >= 0){
      try{
        const strategy = strategies[checkedStrategy]!;
        const result = await strategy.module.fetch(...parameters);
        return {
          result,
          resolved: checkedStrategy,
          cache: result.cache,
          isFallbacked: strategy.isFallback,
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
        const strategy = strategies[i]!;
        const result = await strategy.module.fetch(...parameters);
        return {
          result,
          resolved: i,
          cache: result.cache,
          isFallbacked: strategy.isFallback,
        };
      }
      catch(e){
        logger.warn(`fetch in strategy#${i} failed`, e);
      }
    }

    logger.warn("Fallbacking to the next strategy");
  }
  throw new Error("All strategies failed");
}

export async function attemptGetInfoForStrategies<T extends Cache<string, U>, U>(...parameters: Parameters<Strategy<T, U>["getInfo"]>){
  for(let i = 0; i < strategies.length; i++){
    try{
      if(strategies[i]){
        const strategy = strategies[i]!;
        const result = await strategy.module.getInfo(...parameters);
        return {
          result,
          resolved: i,
          isFallbacked: strategy.isFallback,
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

export function updateStrategyConfiguration(strategyConfig: string){
  if(!strategyConfig){
    initStrategies();
    return;
  }

  const strategyExternalConfig = strategyConfig.padEnd(strategyImporters.length, "0")
    .split("")
    .map(v => v === "1");
  initStrategies(strategyExternalConfig);
}
