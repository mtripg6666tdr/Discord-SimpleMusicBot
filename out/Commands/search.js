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
exports.SearchBase = void 0;
const tslib_1 = require("tslib");
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const _1 = require(".");
const AudioSource_1 = require("../AudioSource");
const config_1 = require("../config");
const definition_1 = require("../definition");
let SearchBase = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class SearchBase extends _classSuper {
            async run(message, context) {
                const { t } = context;
                // URLが渡されたら、そのままキューに追加を試みる
                if (this.urlCheck(context.rawArgs)) {
                    const joinResult = await context.server.joinVoiceChannel(message, { replyOnFail: true });
                    if (!joinResult) {
                        return;
                    }
                    await context.server.playFromUrl(message, context.args, { first: !context.server.player.isConnecting });
                    return;
                }
                // ボイスチャンネルへの参加の試みをしておく
                context.server.joinVoiceChannel(message, {}).catch(this.logger.error);
                // 検索パネルがすでにあるなら
                if (context.server.searchPanel.has(message.member.id)) {
                    const { collector, customIdMap } = context.bot.collectors
                        .create()
                        .setAuthorIdFilter(message.member.id)
                        .setTimeout(1 * 60 * 1000)
                        .createCustomIds({
                        cancelSearch: "button",
                    });
                    const responseMessage = await message.reply({
                        content: `✘${t("search.alreadyOpen")}`,
                        components: [
                            new helper_1.MessageActionRowBuilder()
                                .addComponents(new helper_1.MessageButtonBuilder()
                                .setCustomId(customIdMap.cancelSearch)
                                .setLabel(t("search.removePreviousPanel"))
                                .setStyle("DANGER"))
                                .toOceanic(),
                        ],
                    }).catch(this.logger.error);
                    if (responseMessage) {
                        const panel = context.server.searchPanel.get(message.member.id);
                        if (!panel)
                            return;
                        collector.on("cancelSearch", interaction => {
                            panel.destroy({ quiet: true }).catch(this.logger.error);
                            interaction.createFollowup({
                                content: `🚮${t("search.previousPanelRemoved")}:white_check_mark:`,
                            }).catch(this.logger.error);
                        });
                        collector.setMessage(responseMessage);
                        panel.once("destroy", () => collector.destroy());
                    }
                    return;
                }
                // 検索を実行する
                if (context.rawArgs !== "") {
                    const searchPanel = context.server.searchPanel.create(message, context.rawArgs);
                    if (!searchPanel) {
                        return;
                    }
                    await searchPanel.consumeSearchResult(this.searchContent(context.rawArgs, context), this.consumer.bind(this));
                }
                else {
                    await message.reply(t("commands:search.noArgument")).catch(this.logger.error);
                }
            }
            /** この検索が対象とするURLかを判断する関数 */
            // eslint-disable-next-line unused-imports/no-unused-vars
            urlCheck(query) {
                return false;
            }
            constructor() {
                super(...arguments);
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
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
exports.SearchBase = SearchBase;
const config = (0, config_1.getConfig)();
class Search extends SearchBase {
    constructor() {
        super({
            alias: ["search", "se"],
            unlist: false,
            category: "playlist",
            args: [{
                    type: "string",
                    name: "keyword",
                    required: true,
                }],
            requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
            shouldDefer: true,
            disabled: config.isDisabledSource("youtube"),
            usage: true,
            examples: true,
        });
    }
    async searchContent(query, context) {
        return (0, AudioSource_1.searchYouTube)(query)
            .then(result => {
            const videos = result.items.filter(item => item.type === "video");
            context.bot.cache.addSearch(query, videos);
            return videos;
        });
    }
    consumer(items) {
        const { t } = (0, _1.getCommandExecutionContext)();
        return items.map(item => ({
            url: item.url,
            title: "title" in item ? item.title : `*${item.name}`,
            duration: item.duration || "0",
            thumbnail: ("bestThumbnail" in item ? item.bestThumbnail.url : item.thumbnail) || definition_1.DefaultAudioThumbnailURL,
            author: item.author?.name || t("unknown"),
            description: `${t("length")}: ${item.duration}, ${t("channelName")}: ${item.author?.name || t("unknown")}`,
        })).filter(n => n);
    }
    urlCheck(query) {
        return query.startsWith("http://") || query.startsWith("https://");
    }
}
exports.default = Search;
//# sourceMappingURL=search.js.map