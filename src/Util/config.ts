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
import { z } from "zod";

/* eslint-disable newline-per-chained-call */
const Config = z.object({
  adminId: z.string().nullable(),
  debug: z.boolean(),
  errorChannel: z.string().min(1).nullable(),
  maintenance: z.boolean(),
  proxy: z.string().min(1).nullable(),
  prefix: z.string().min(1).nullish().default(">"),
  webserver: z.boolean().optional().default(true),
});
/* eslint-enable newline-per-chained-call */

const rawConfig = fs.readFileSync(path.join(__dirname, "../../config.json"), {encoding: "utf-8"});

const config = Config.parse(CJSON.parse(rawConfig, null, true));

export = config;
