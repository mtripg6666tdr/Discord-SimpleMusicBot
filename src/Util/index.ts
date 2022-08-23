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
