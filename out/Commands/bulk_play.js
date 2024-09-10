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
const tslib_1 = require("tslib");
const _1 = require(".");
const AudioSource_1 = require("../AudioSource");
let BulkPlay = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class BulkPlay extends _classSuper {
            constructor() {
                super({
                    alias: ["bulk_play", "bulk-play", "bulkplay"],
                    unlist: false,
                    category: "player",
                    args: [
                        {
                            type: "string",
                            name: "keyword1",
                            required: true,
                        },
                        {
                            type: "string",
                            name: "keyword2",
                            required: true,
                        },
                        {
                            type: "string",
                            name: "keyword3",
                            required: false,
                        },
                        {
                            type: "string",
                            name: "keyword4",
                            required: false,
                        },
                        {
                            type: "string",
                            name: "keyword5",
                            required: false,
                        },
                    ],
                    requiredPermissionsOr: [],
                    shouldDefer: true,
                    usage: true,
                    examples: true,
                });
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                if (!await context.server.joinVoiceChannel(message, { replyOnFail: true }))
                    return;
                const { t } = context;
                if (context.args.length === 0) {
                    await message.reply(t("commands:play.noContent")).catch(this.logger.error);
                    return;
                }
                const msg = await message.channel.createMessage({
                    content: `🔍${t("search.searching")}...`,
                });
                const keywords = (await Promise.allSettled(context.args.map(async (keyword) => {
                    if (keyword.startsWith("http://") || keyword.startsWith("https://")) {
                        return keyword;
                    }
                    let videos = null;
                    if (context.bot.cache.hasSearch(keyword)) {
                        videos = await context.bot.cache.getSearch(keyword);
                    }
                    else {
                        const result = await (0, AudioSource_1.searchYouTube)(keyword);
                        videos = result.items.filter(it => it.type === "video");
                        context.bot.cache.addSearch(context.rawArgs, videos);
                    }
                    if (videos.length === 0) {
                        throw new Error("No result found.");
                    }
                    return videos[0].url;
                })))
                    .filter(res => res.status === "fulfilled")
                    .map(res => res.value);
                if (keywords.length === 0) {
                    await Promise.allSettled([
                        message.reply(t("commands:play.noContent")).catch(this.logger.error),
                        msg.delete(),
                    ]);
                    return;
                }
                else if (keywords.length !== context.args.length) {
                    await msg.edit({
                        content: t("commands:bulk_play.partialSuccess"),
                    }).catch(this.logger.error);
                }
                await Promise.allSettled([
                    context.server.playFromUrl(message, keywords, {}),
                    msg.delete().catch(this.logger.error),
                ]);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _run_decorators = [(_b = _1.BaseCommand).updateBoundChannel.bind(_b)];
            tslib_1.__esDecorate(_a, null, _run_decorators, { kind: "method", name: "run", static: false, private: false, access: { has: obj => "run" in obj, get: obj => obj.run }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.default = BulkPlay;
//# sourceMappingURL=bulk_play.js.map