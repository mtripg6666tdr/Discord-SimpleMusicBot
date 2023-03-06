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

import type { Static } from "@sinclair/typebox";

import * as fs from "fs";
import * as path from "path";

import { Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { Value } from "@sinclair/typebox/value";
import CJSON from "comment-json";

const GuildBGMContainer = Type.Object({
  voiceChannelId: Type.RegEx(/^\d+$/),
  allowEditQueue: Type.Boolean(),
  enableQueueLoop: Type.Boolean(),
  items: Type.Array(Type.String({ minLength: 1 })),
  volume: Type.Number({ minimum: 5, maximum: 200 }),
  mode: Type.Union([Type.Literal("only"), Type.Literal("prior"), Type.Literal("normal")]),
});

const Config = Type.Object({
  adminId: Type.Union([Type.RegEx(/^\d+$/), Type.Array(Type.RegEx(/^\d+$/)), Type.Null()], {
    default: false,
  }),
  debug: Type.Boolean({ default: false }),
  errorChannel: Type.Union([Type.RegEx(/^\d+$/), Type.Null()], { default: null }),
  maintenance: Type.Boolean(),
  proxy: Type.Union([Type.RegEx(/^https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+$/), Type.Null()], {
    default: null,
  }),
  prefix: Type.Optional(Type.String({ minLength: 1, default: ">" })),
  webserver: Type.Optional(Type.Boolean({ default: true })),
  bgm: Type.Optional(Type.Record(Type.RegEx(/^\d+$/), GuildBGMContainer, { default: {} })),
  noMessageContent: Type.Optional(Type.Boolean({ default: false })),
  twentyFourSeven: Type.Optional(Type.Array(Type.RegEx(/^\d+$/), { default: [] })),
  alwaysTwentyFourSeven: Type.Optional(Type.Boolean({ default: false })),
  disabledSources: Type.Optional(Type.Array(Type.String(), { default: [] })),
});

const checker = TypeCompiler.Compile(Config);

const rawConfig = fs.readFileSync(path.join(__dirname, "../../config.json"), {
  encoding: "utf-8",
});

const config = CJSON.parse(rawConfig, null, true);

const errs = [...checker.Errors(config)];
if(errs.length > 0){
  const er = new Error("Invalid config.json");
  console.log(errs);
  Object.defineProperty(er, "errors", {
    value: errs,
  });
  throw er;
}

if(typeof config !== "object" || !("debug" in config) || !config.debug){
  console.error(
    "This is still a development phase, and running without debug mode is currently disabled.",
  );
  console.error("You should use the latest version instead of the current branch.");
  process.exit(1);
}

export default Object.assign(
  Object.create(null),
  Value.Create(Config),
  {
    prefix: ">",
    webserver: true,
    bgm: {},
    noMessageContent: false,
    twentyFourSeven: [],
    alwaysTwentyFourSeven: false,
    disabledSources: [],
  },
  config,
) as unknown as Static<typeof Config>;
export type GuildBGMContainerType = Static<typeof GuildBGMContainer>;
