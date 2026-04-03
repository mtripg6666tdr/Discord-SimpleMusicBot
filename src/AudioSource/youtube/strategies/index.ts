/*
 * Copyright 2021-2025 mtripg6666tdr
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
import { strategyHealthMonitor } from "./healthMonitor";

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

const STRATEGY_TIMEOUT_MS = 15_000;
const BINARY_STRATEGY_TIMEOUT_MS = 30_000;
const BINARY_STRATEGY_INDICES = new Set([6, 7, 8]);

function getStrategyTimeout(strategyIndex: number): number {
  return BINARY_STRATEGY_INDICES.has(strategyIndex) ? BINARY_STRATEGY_TIMEOUT_MS : STRATEGY_TIMEOUT_MS;
}

function withTimeout(promise: Promise<any>, timeoutMs: number, label: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Strategy ${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then(
      result => { clearTimeout(timer); resolve(result); },
      error => { clearTimeout(timer); reject(error); },
    );
  });
}

const strategyImporters: StrategyImporter[] = [
  { enable: false, isFallback: false, importer: () => require("./ytdl-core") },
  { enable: false, isFallback: false, importer: () => require("./play-dl") },
  // { enable: false, isFallback: false, importer: () => require("./distube_ytdl-core") },
  { enable: false, isFallback: false, importer: () => require("./youtubei_web") },
  { enable: true, isFallback: false, importer: () => require("./youtubei_embed") },
  { enable: false, isFallback: false, importer: () => require("./distube_ytdl-core") },
  { enable: false, isFallback: true, importer: () => require("./play-dl-test") },
  { enable: false, isFallback: true, importer: () => require("./youtube-dl") },
  { enable: true, isFallback: false, importer: () => require("./yt-dlp") },
  { enable: true, isFallback: true, importer: () => require("./nightly_youtube-dl") },
] as const;

export let strategies: (Strategies | null)[] = [];

function initStrategies(configEnabled: boolean[] | null = null) {
  strategies = strategyImporters.map(({ enable, importer, isFallback }, i) => {
    if (Array.isArray(configEnabled) ? !configEnabled[i] : !enable) {
      logger.warn(`strategy#${i} is currently disabled.`);
      return null;
    }

    try {
      const { default: Module } = importer();
      return {
        module: new Module(i),
        isFallback,
      };
    } catch (e) {
      logger.warn(`failed to load strategy#${i}`);
      if (config.debug) {
        logger.debug(e);
      }
      return null;
    }
  });
}

initStrategies();

export async function attemptFetchForStrategies<T extends Cache<string, U>, U>(parameters: Parameters<Strategy<T, U>["fetch"]>, attemptOffsetStrategyName?: string) {
  let checkedStrategy = -1;
  let generator = function* () {
    for (let i = 0; i < strategies.length; i++) {
      yield i;
    }
  };

  if (attemptOffsetStrategyName) {
    logger.trace("Offset strategy", attemptOffsetStrategyName);
    const originalGenerator = generator;
    generator = function* () {
      const pool: number[] = [];
      let found = false;
      for (const i of originalGenerator()) {
        if (found || strategies[i]?.module.cacheType === attemptOffsetStrategyName) {
          found = true;
          yield i;
        } else {
          pool.push(i);
        }
      }
      yield* pool;
    };
  } else if (parameters[2]) {
    const cacheType = parameters[2].type;
    checkedStrategy = strategies.findIndex(s => s && s.module.cacheType === cacheType);
    if (checkedStrategy >= 0) {
      if (!strategyHealthMonitor.isDisabled(checkedStrategy)) {
        const startTime = Date.now();
        try {
          const strategy = strategies[checkedStrategy]!;
          const result = await withTimeout(
            strategy.module.fetch(...parameters),
            getStrategyTimeout(checkedStrategy),
            `#${checkedStrategy}`,
          );
          strategyHealthMonitor.recordSuccess(checkedStrategy, Date.now() - startTime);
          return {
            result,
            resolved: checkedStrategy,
            isFallbacked: strategy.isFallback,
          };
        } catch (e) {
          strategyHealthMonitor.recordFailure(checkedStrategy);
          logger.warn(`fetch in strategy#${checkedStrategy} failed`, e);
        }
      } else {
        logger.warn(`strategy#${checkedStrategy} is auto-disabled by health monitor, skipping`);
      }
    }
  }
  for (const i of generator()) {
    if (i === checkedStrategy || !strategies[i]) {
      continue;
    }
    if (strategyHealthMonitor.isDisabled(i)) {
      logger.warn(`strategy#${i} is auto-disabled by health monitor, skipping`);
      continue;
    }
    const startTime = Date.now();
    try {
      const strategy = strategies[i]!;
      const result = await withTimeout(
        strategy.module.fetch(...parameters),
        getStrategyTimeout(i),
        `#${i}`,
      );
      strategyHealthMonitor.recordSuccess(i, Date.now() - startTime);
      return {
        result,
        resolved: i,
        isFallbacked: strategy.isFallback,
      };
    } catch (e) {
      strategyHealthMonitor.recordFailure(i);
      logger.warn(`fetch in strategy#${i} failed`, e);
      logger.warn("Fallbacking to the next strategy");
    }
  }
  throw new Error("All strategies failed");
}

export async function attemptGetInfoForStrategies<T extends Cache<string, U>, U>(parameters: Parameters<Strategy<T, U>["getInfo"]>) {
  for (let i = 0; i < strategies.length; i++) {
    try {
      if (strategies[i]) {
        if (strategyHealthMonitor.isDisabled(i)) {
          logger.warn(`strategy#${i} is auto-disabled by health monitor, skipping`);
          continue;
        }
        const strategy = strategies[i]!;
        const startTime = Date.now();
        const result = await withTimeout(
          strategy.module.getInfo(...parameters),
          getStrategyTimeout(i),
          `#${i}`,
        );
        strategyHealthMonitor.recordSuccess(i, Date.now() - startTime);
        return {
          result,
          resolved: i,
          isFallbacked: strategy.isFallback,
        };
      }
    } catch (e) {
      strategyHealthMonitor.recordFailure(i);
      logger.warn(`getInfo in strategy#${i} failed`, e);
      logger.warn(
        i + 1 === strategies.length
          ? "All strategies failed"
          : "Fallbacking to the next strategy",
      );
    }
  }
  throw new Error("All strategies failed");
}

export function updateStrategyConfiguration(strategyConfig: string) {
  if (!strategyConfig) {
    initStrategies();
    return;
  }

  const strategyExternalConfig = strategyConfig.padEnd(strategyImporters.length, "0")
    .split("")
    .map(v => v === "1");
  initStrategies(strategyExternalConfig);
}
