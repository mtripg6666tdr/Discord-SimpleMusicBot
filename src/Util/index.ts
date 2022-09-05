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

import * as addOn from "./addon";
import * as color from "./color";
import * as config from "./config";
import * as db from "./database";
import * as effects from "./effect";
import { erisUtil as eris } from "./eris";
import * as fs from "./fs";
import * as general from "./general";
import * as logger from "./log";
import * as lyrics from "./lyrics";
import * as math from "./math";
import * as string from "./string";
import * as system from "./system";
import * as time from "./time";
import * as ua from "./ua";
import * as web from "./web";
export const Util = {
  addOn,
  color,
  config,
  db,
  effects,
  fs,
  general,
  logger,
  lyrics,
  math,
  string,
  system,
  time,
  ua,
  web,
  eris,
} as const;
export default Util;
export type LoggerType = logger.LoggerType;
