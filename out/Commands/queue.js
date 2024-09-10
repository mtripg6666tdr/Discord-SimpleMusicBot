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
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const _1 = require(".");
const Util = tslib_1.__importStar(require("../Util"));
const color_1 = require("../Util/color");
let Queue = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class Queue extends _classSuper {
            constructor() {
                super({
                    alias: ["キューを表示", "再生待ち", "queue", "q"],
                    unlist: false,
                    category: "playlist",
                    args: [{
                            type: "integer",
                            name: "page",
                            required: false,
                        }],
                    requiredPermissionsOr: [],
                    shouldDefer: false,
                });
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                const { t } = context;
                const queue = context.server.queue;
                if (queue.length === 0) {
                    await message.reply(`:face_with_raised_eyebrow:${t("commands:queue.queueEmpty")}`).catch(this.logger.error);
                    return;
                }
                // 合計所要時間の計算
                const totalLength = queue.lengthSecondsActual;
                let _page = context.rawArgs === "" ? 0 : Number(context.rawArgs);
                if (isNaN(_page))
                    _page = 1;
                if (queue.length > 0 && _page > Math.ceil(queue.length / 10)) {
                    await message.reply(`:warning:${t("commands:queue.pageOutOfRange")}`).catch(this.logger.error);
                    return;
                }
                // 合計ページ数割り出し
                const totalpage = Math.ceil(queue.length / 10);
                // ページのキューを割り出す
                const getQueueEmbed = (page) => {
                    const fields = [];
                    for (let i = 10 * page; i < 10 * (page + 1); i++) {
                        if (queue.length <= i) {
                            break;
                        }
                        const q = queue.get(i);
                        const _t = Number(q.basicInfo.lengthSeconds);
                        const [min, sec] = Util.time.calcMinSec(_t);
                        fields.push({
                            name: i !== 0
                                ? i.toString()
                                : context.server.player.isPlaying
                                    ? t("components:nowplaying.nowplayingItemName")
                                    : t("components:nowplaying.waitForPlayingItemName"),
                            value: [
                                q.basicInfo.isPrivateSource ? q.basicInfo.title : `[${q.basicInfo.title}](${q.basicInfo.url})`,
                                `${t("length")}: \`${q.basicInfo.isYouTube() && q.basicInfo.isLiveStream
                                    ? t("commands:log.liveStream")
                                    : `${min}:${sec}`} \``,
                                `${t("components:nowplaying.requestedBy")}: \`${q.additionalInfo.addedBy.displayName}\` `,
                                q.basicInfo.npAdditional(),
                            ].join("\r\n"),
                        });
                    }
                    const [thour, tmin, tsec] = Util.time.calcHourMinSec(totalLength);
                    return new helper_1.MessageEmbedBuilder()
                        .setTitle(t("components:queue.queueTitle", { server: message.guild.name }))
                        .setDescription(`\`${t("currentPage", { count: page + 1 })}(${t("allPages", { count: totalpage })})\``)
                        .addFields(...fields)
                        .setAuthor({
                        name: context.client.user.username,
                        iconURL: context.client.user.avatarURL(),
                    })
                        .setFooter({
                        text: [
                            `${t("commands:queue.songCount", { count: queue.length })}`,
                            `${t("commands:queue.total")}: ${thour}:${tmin}:${tsec}`,
                            `${t("components:queue.trackloop")}:${queue.loopEnabled ? "⭕" : "❌"}`,
                            `${t("components:queue.queueloop")}:${queue.queueLoopEnabled ? "⭕" : "❌"}`,
                            `${t("components:queue.autoplayRelated")}:${context.server.preferences.addRelated ? "⭕" : "❌"}`,
                            `${t("components:queue.equallyplayback")}:${context.server.preferences.equallyPlayback ? "⭕" : "❌"}`,
                        ].join(" | "),
                    })
                        .setThumbnail(message.guild.iconURL())
                        .setColor((0, color_1.getColor)("QUEUE"))
                        .toOceanic();
                };
                // 送信
                if (totalpage > 1) {
                    const pagenation = await context.bot.collectors
                        .createPagenation()
                        .setPages(getQueueEmbed, totalpage)
                        .send(message);
                    context.server.queue.eitherOnce(["change", "changeWithoutCurrent"], pagenation.destroy.bind(pagenation));
                }
                else {
                    await message.reply({ content: "", embeds: [getQueueEmbed(_page)] }).catch(this.logger.error);
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
exports.default = Queue;
//# sourceMappingURL=queue.js.map