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

import * as fs from "fs";
import * as path from "path";

import CJSON from "comment-json";

type ConfigJson = {
  adminId: string,
  debug: boolean,
  maintenance: boolean,
  errorChannel: string,
  proxy: string,
  prefix:string,
  webserver:boolean,
};

const rawConfig = fs.readFileSync(path.join(__dirname, "../../config.json"), {encoding: "utf-8"});

const config = Object.assign({
  prefix: ">",
  webserver: true,
}, CJSON.parse(rawConfig, null, true)) as unknown as ConfigJson;

if(![
  config.adminId === null || typeof config.adminId === "string",
  typeof config.debug === "boolean",
  config.errorChannel === null || typeof config.errorChannel === "string",
  typeof config.maintenance === "boolean",
  config.proxy === null || typeof config.proxy === "string",
  (typeof config.prefix === "string" && config.prefix.length >= 1) || config.prefix === null,
  typeof config.webserver === "boolean",
].every(test => test)){
  throw new Error("Invalid config.json");
}

export const { prefix, adminId, debug, errorChannel, maintenance, proxy, webserver } = config;
