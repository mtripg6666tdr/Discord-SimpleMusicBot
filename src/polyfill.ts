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

import { getLogger } from "./logger";

const logger = getLogger("Polyfill");

let polyfillCount = 0;

if (typeof global.fetch === "undefined") {
  logger.warn("Native fetch function is not defined.");
  logger.warn("Installing a fetch polyfill.");

  polyfillCount++;

  global.fetch = require("undici").fetch;
}

if (typeof global.structuredClone === "undefined") {
  logger.warn("Native structuredClone function is not defined.");
  logger.warn("Installing a structuredClone polyfill.");

  polyfillCount++;

  global.structuredClone = function structuredClone<T>(value: T) {
    return JSON.parse(JSON.stringify(value));
  };
}

if (typeof global.ReadableStream === "undefined") {
  logger.warn("Native ReadableStream class is not globally defined.");
  logger.warn("Setting up ReadableStream object imported from stream/web standard module.");

  polyfillCount++;

  global.ReadableStream = require("stream/web").ReadableStream;
}

if (typeof Array.prototype.findLastIndex === "undefined") {
  logger.warn("Native Array.prototype.findLastIndex function is not defined.");
  logger.warn("Installing a findLastIndex polyfill.");

  polyfillCount++;

  Array.prototype.findLastIndex = function findLastIndex<T>(callback: (value: T, index: number, array: T[]) => boolean, thisArg?: any): number {
    for (let i = this.length - 1; i >= 0; i--) {
      if (callback.call(thisArg, this[i], i, this)) {
        return i;
      }
    }

    return -1;
  };
}

if (polyfillCount > 0) {
  logger.warn(`Installed ${polyfillCount} polyfill(s), which means Node.js may be stale.`);
  logger.warn("We strongly recommend you upgrading Node.js to v18 at least or higher.");
}

logger.debug("Patching @distube/ytdl-core to handle upcoming videos correctly.");
const dYtdlUtils = require("@distube/ytdl-core/lib/utils");
const originalPlayError = dYtdlUtils.playError;
dYtdlUtils.playError = function playError(...args: any[]) {
  if (args[0]?.playabilityStatus?.status === "LIVE_STREAM_OFFLINE") {
    args[0].playabilityStatus.status += "_REPLACED";
  }
  return originalPlayError.apply(this, args);
};
