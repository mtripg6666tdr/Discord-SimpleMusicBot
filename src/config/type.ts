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

import { Type } from "@sinclair/typebox";

const GuildBGMContainer = Type.Object({
  voiceChannelId: Type.RegExp(/^\d+$/),
  allowEditQueue: Type.Boolean(),
  enableQueueLoop: Type.Boolean(),
  items: Type.Array(Type.String({ minLength: 1 })),
  volume: Type.Number({ minimum: 5, maximum: 200 }),
  mode: Type.Union([
    Type.Literal("only"),
    Type.Literal("prior"),
    Type.Literal("normal"),
  ]),
});

export const ConfigSchema = Type.Object({
  adminId: Type.Union([
    Type.RegExp(/^\d+$/),
    Type.Array(Type.RegExp(/^\d+$/)),
    Type.Null(),
  ], { default: false }),

  debug: Type.Boolean({ default: false }),

  errorChannel: Type.Union([
    Type.RegExp(/^\d+$/),
    Type.Null(),
  ], { default: null }),

  maintenance: Type.Boolean(),

  proxy: Type.Optional(Type.Union([
    Type.RegExp(/^https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+$/),
    Type.Null(),
  ], { default: null })),

  prefix: Type.String({ minLength: 1, default: ">" }),

  webserver: Type.Boolean({ default: true }),

  bgm: Type.Record(Type.RegExp(/^\d+$/), GuildBGMContainer, { default: {} }),

  noMessageContent: Type.Boolean({ default: false }),

  twentyFourSeven: Type.Array(Type.RegExp(/^\d+$/), { default: [] }),

  alwaysTwentyFourSeven: Type.Boolean({ default: false }),

  disabledSources: Type.Optional(Type.Array(Type.String(), { default: [] })),

  cacheLevel: Type.Union([
    Type.Literal("memory"),
    Type.Literal("persistent"),
    //Type.Literal("full"),
  ], { default: "memory" }),

  cacheLimit: Type.Optional(Type.Number({ default: 500 })),

  defaultLanguage: Type.String({ default: "ja" }),

  country: Type.String({ default: "JP" }),

  maxLogFiles: Type.Optional(Type.Number({ default: 100 })),

  botWhiteList: Type.Optional(Type.Union([
    Type.Array(Type.RegExp(/^\d+$/), { default: [] }),
    Type.Null(),
  ], { default: null })),

  djRoleNames: Type.Optional(Type.Array(Type.String(), { default: ["DJ"] })),
});

export type GuildBGMContainerType = Static<typeof GuildBGMContainer>;
