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
const GuildBGMContainer = z.object({
  voiceChannelId: z.string().regex(/^\d+$/, {message: "channelId is not a snowflake"}),
  allowEditQueue: z.boolean(),
  enableQueueLoop: z.boolean(),
  items: z.array(z.string()).nonempty({message: "items cannot be empty"}),
  volume: z.number().min(5).max(200),
  mode: z.union([z.literal("only"), z.literal("prior"), z.literal("normal")]),
});

const Config = z.object({
  adminId: z.string().regex(/^\d+$/, {message: "adminId is not a snowflake"}).nullable(),
  debug: z.boolean(),
  errorChannel: z.string().min(1).regex(/^\d+$/, {message: "errorChannel is not a snowflake"}).nullable(),
  maintenance: z.boolean(),
  proxy: z.string().url("proxy value must be resolvable as url").nullable(),
  prefix: z.string().min(1).nullish().default(">"),
  webserver: z.boolean().optional().default(true),
  bgm: z.record(z.string().regex(/^\d+$/, {message: "bgm object key is not a snowflake"}), GuildBGMContainer).optional(),
});
/* eslint-enable newline-per-chained-call */

const rawConfig = fs.readFileSync(path.join(__dirname, "../../config.json"), {encoding: "utf-8"});

const config = Config.parse(CJSON.parse(rawConfig, null, true));

export default config;
export type GuildBGMContainerType = z.infer<typeof GuildBGMContainer>;
