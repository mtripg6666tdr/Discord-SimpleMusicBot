"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
const GuildBGMContainer = typebox_1.Type.Object({
    voiceChannelId: typebox_1.Type.RegExp(/^\d+$/),
    allowEditQueue: typebox_1.Type.Boolean(),
    enableQueueLoop: typebox_1.Type.Boolean(),
    items: typebox_1.Type.Array(typebox_1.Type.String({ minLength: 1 })),
    volume: typebox_1.Type.Number({ minimum: 5, maximum: 200 }),
    mode: typebox_1.Type.Union([
        typebox_1.Type.Literal("only"),
        typebox_1.Type.Literal("prior"),
        typebox_1.Type.Literal("normal"),
    ]),
});
exports.ConfigSchema = typebox_1.Type.Object({
    adminId: typebox_1.Type.Union([
        typebox_1.Type.RegExp(/^\d+$/),
        typebox_1.Type.Array(typebox_1.Type.RegExp(/^\d+$/)),
        typebox_1.Type.Null(),
    ], { default: false }),
    debug: typebox_1.Type.Boolean({ default: false }),
    errorChannel: typebox_1.Type.Union([
        typebox_1.Type.RegExp(/^\d+$/),
        typebox_1.Type.Null(),
    ], { default: null }),
    maintenance: typebox_1.Type.Boolean(),
    proxy: typebox_1.Type.Optional(typebox_1.Type.Union([
        typebox_1.Type.RegExp(/^https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+$/),
        typebox_1.Type.Null(),
    ], { default: null })),
    prefix: typebox_1.Type.String({ minLength: 1, default: ">" }),
    webserver: typebox_1.Type.Boolean({ default: true }),
    bgm: typebox_1.Type.Record(typebox_1.Type.RegExp(/^\d+$/), GuildBGMContainer, { default: {} }),
    noMessageContent: typebox_1.Type.Boolean({ default: false }),
    twentyFourSeven: typebox_1.Type.Array(typebox_1.Type.RegExp(/^\d+$/), { default: [] }),
    alwaysTwentyFourSeven: typebox_1.Type.Boolean({ default: false }),
    disabledSources: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String(), { default: [] })),
    cacheLevel: typebox_1.Type.Union([
        typebox_1.Type.Literal("memory"),
        typebox_1.Type.Literal("persistent"),
        //Type.Literal("full"),
    ], { default: "memory" }),
    cacheLimit: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 500 })),
    defaultLanguage: typebox_1.Type.String({ default: "ja" }),
    country: typebox_1.Type.String({ default: "JP" }),
    maxLogFiles: typebox_1.Type.Optional(typebox_1.Type.Number({ default: 100 })),
    botWhiteList: typebox_1.Type.Optional(typebox_1.Type.Union([
        typebox_1.Type.Array(typebox_1.Type.RegExp(/^\d+$/), { default: [] }),
        typebox_1.Type.Null(),
    ], { default: null })),
    djRoleNames: typebox_1.Type.Optional(typebox_1.Type.Array(typebox_1.Type.String(), { default: ["DJ"] })),
});
//# sourceMappingURL=schema.js.map