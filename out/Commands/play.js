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
const oceanic_js_1 = require("oceanic.js");
const _1 = require(".");
const AudioSource_1 = require("../AudioSource");
let Play = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class Play extends _classSuper {
            constructor() {
                super({
                    alias: ["play", "p", "resume", "re"],
                    unlist: false,
                    category: "player",
                    args: [
                        {
                            type: "string",
                            name: "keyword",
                            required: false,
                        },
                        {
                            type: "file",
                            name: "audiofile",
                            required: false,
                        },
                    ],
                    usage: false,
                    examples: false,
                    requiredPermissionsOr: [],
                    shouldDefer: true,
                    messageCommand: true,
                });
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                const { t } = context;
                const server = context.server;
                const firstAttachment = Array.isArray(message.attachments) ? message.attachments[0] : message.attachments.first();
                // キューが空だし引数もないし添付ファイルもない
                if (server.queue.length === 0
                    && context.rawArgs === ""
                    && !firstAttachment
                    && !(message["_message"] && message["_message"].referencedMessage)
                    && !(message["_interaction"] && "type" in message["_interaction"].data && message["_interaction"].data.type === oceanic_js_1.ApplicationCommandTypes.MESSAGE)) {
                    await message.reply(t("commands:play.noContent")).catch(this.logger.error);
                    return;
                }
                const wasConnected = server.player.isConnecting;
                //VCに入れない
                if (!await context.server.joinVoiceChannel(message, { replyOnFail: true })) {
                    return;
                }
                // 一時停止されてるね
                if (context.rawArgs === "" && server.player.isPaused) {
                    server.player.resume();
                    await message.reply({
                        content: `${context.includeMention ? `<@${message.member.id}> ` : ""} :arrow_forward:${t("commands:play.resuming")}`,
                        allowedMentions: {
                            users: false,
                        },
                    }).catch(this.logger.error);
                    return;
                }
                if (context.rawArgs !== "") {
                    // 引数ついてたらそれ優先して再生する
                    if (context.rawArgs.startsWith("http://") || context.rawArgs.startsWith("https://")) {
                        // ついていた引数がURLなら
                        await context.server.playFromUrl(message, context.args, { first: !wasConnected });
                    }
                    else {
                        // URLでないならキーワードとして検索
                        const msg = await message.channel.createMessage({
                            content: `🔍${t("search.searching")}...`,
                        });
                        try {
                            let videos = null;
                            if (context.bot.cache.hasSearch(context.rawArgs)) {
                                videos = await context.bot.cache.getSearch(context.rawArgs);
                            }
                            else {
                                const result = await (0, AudioSource_1.searchYouTube)(context.rawArgs);
                                videos = result.items.filter(it => it.type === "video");
                                context.bot.cache.addSearch(context.rawArgs, videos);
                            }
                            if (videos.length === 0) {
                                await Promise.allSettled([
                                    message.reply(`:face_with_monocle: ${t("commands:play.noMusicFound")}`),
                                    msg.delete(),
                                ]);
                                return;
                            }
                            await Promise.allSettled([
                                context.server.playFromUrl(message, videos[0].url, { first: !wasConnected, cancellable: context.server.queue.length >= 1 }),
                                msg.delete().catch(this.logger.error),
                            ]);
                        }
                        catch (e) {
                            this.logger.error(e);
                            message.reply(`✗ ${t("internalErrorOccurred")}`).catch(this.logger.error);
                            msg.delete().catch(this.logger.error);
                        }
                    }
                }
                else if (firstAttachment) {
                    // 添付ファイルを確認
                    await context.server.playFromUrl(message, firstAttachment.url, { first: !wasConnected });
                }
                else if (message["_message"]?.referencedMessage) {
                    // 返信先のメッセージを確認
                    const messageReference = message["_message"].referencedMessage;
                    if (messageReference.inCachedGuildChannel()) {
                        context.server
                            .playFromMessage(message, messageReference, context, { first: !wasConnected })
                            .catch(this.logger.error);
                    }
                }
                else if (message["_interaction"] && "type" in message["_interaction"].data && message["_interaction"].data.type === oceanic_js_1.ApplicationCommandTypes.MESSAGE) {
                    const messageReference = message["_interaction"].data.resolved.messages.first();
                    if (messageReference?.inCachedGuildChannel()) {
                        context.server
                            .playFromMessage(message, messageReference, context, { first: !wasConnected })
                            .catch(this.logger.error);
                    }
                }
                else if (server.queue.length >= 1) {
                    // なにもないからキューから再生
                    if (!server.player.isPlaying && !server.player.preparing) {
                        await message.reply(t("commands:play.playing")).catch(this.logger.error);
                        await server.player.play({ bgm: false });
                    }
                    else {
                        await message.reply(t("commands:play.alreadyPlaying")).catch(this.logger.error);
                    }
                }
                else {
                    await message.reply(`✘ ${t("commands:play.queueEmpty")}`).catch(this.logger.error);
                }
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
exports.default = Play;
//# sourceMappingURL=play.js.map