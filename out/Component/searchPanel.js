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
exports.SearchPanel = void 0;
const tslib_1 = require("tslib");
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const Commands_1 = require("../Commands");
const Structure_1 = require("../Structure");
const color_1 = require("../Util/color");
const decorators_1 = require("../Util/decorators");
const config_1 = require("../config");
const config = (0, config_1.getConfig)();
let SearchPanel = (() => {
    var _a;
    let _classSuper = Structure_1.LogEmitter;
    let _instanceExtraInitializers = [];
    let _consumeSearchResult_decorators;
    return _a = class SearchPanel extends _classSuper {
            get status() {
                return this._status;
            }
            set status(val) {
                this._status = val;
                if (val === "destroyed")
                    this.emit("destroy");
            }
            get options() {
                if (!this._options) {
                    throw new Error("Search has not been done yet.");
                }
                return this._options;
            }
            get commandMessage() {
                return this._commandMessage;
            }
            get responseMesasge() {
                return this._responseMessage;
            }
            constructor(_commandMessage, query, isRawTitle = false) {
                super("SearchPanel");
                this._commandMessage = (tslib_1.__runInitializers(this, _instanceExtraInitializers), _commandMessage);
                this.query = query;
                this.isRawTitle = isRawTitle;
                this._status = "init";
                this._options = null;
                this._responseMessage = null;
                if (!_commandMessage) {
                    throw new Error("Invalid arguments passed");
                }
            }
            async consumeSearchResult(searchPromise, consumer) {
                const { t } = (0, Commands_1.getCommandExecutionContext)();
                if (this.status !== "init") {
                    return false;
                }
                this.status = "consumed";
                this.t = t;
                let reply = null;
                try {
                    let waitedPromiseResult = null;
                    [reply, waitedPromiseResult] = await Promise.all([this._commandMessage.reply(`🔍${t("search.searching")}...`), searchPromise]);
                    if ("transformedQuery" in waitedPromiseResult) {
                        this.query = waitedPromiseResult.transformedQuery;
                    }
                    const songResult = this._options = consumer("transformedQuery" in waitedPromiseResult
                        ? waitedPromiseResult.result
                        : waitedPromiseResult, t).slice(0, 20);
                    if (songResult.length <= 0) {
                        await reply.edit(`:pensive:${t("search.notFound")}`);
                        return false;
                    }
                    let searchPanelDescription = "";
                    const selectOpts = songResult.map(({ url, title, author, duration, description }, j) => {
                        searchPanelDescription += `\`${j + 1}.\` [${title}](${url}) \`${duration}\` - \`${author}\` \r\n\r\n`;
                        return {
                            label: `${(j + 1).toString()}. ${title.length > 90 ? title.substring(0, 90) + "…" : title}`,
                            description,
                            value: (j + 1).toString(),
                        };
                    });
                    this._responseMessage = await reply.edit({
                        content: "",
                        embeds: [
                            new helper_1.MessageEmbedBuilder()
                                .setTitle(this.isRawTitle ? this.query : `${t("components:search.resultTitle", { query: this.query })}✨`)
                                .setColor((0, color_1.getColor)("SEARCH"))
                                .setDescription(searchPanelDescription)
                                .setFooter({
                                iconURL: this._commandMessage.member.avatarURL(),
                                text: config.noMessageContent
                                    ? t("components:search.resultFooterInteraction")
                                    : t("components:search.resultFooterMessage"),
                            })
                                .toOceanic(),
                        ],
                        components: [
                            new helper_1.MessageActionRowBuilder()
                                .addComponents(new helper_1.MessageStringSelectMenuBuilder()
                                .setCustomId("search")
                                .setPlaceholder(config.noMessageContent
                                ? t("components:search.select")
                                : t("components:search.typeOrSelect"))
                                .setMinValues(1)
                                .setMaxValues(songResult.length - 1)
                                .addOptions(...selectOpts, {
                                label: t("cancel"),
                                value: "cancel",
                            }))
                                .toOceanic(),
                        ],
                    });
                    this.emit("open", this._responseMessage);
                    return true;
                }
                catch (e) {
                    this.logger.error(e);
                    if (reply) {
                        reply.edit(`✘${t("internalErrorOccurred")}`)
                            .catch(this.logger.error);
                    }
                    else {
                        this._commandMessage.reply(`✘${t("internalErrorOccurred")}`)
                            .catch(this.logger.error);
                    }
                    return false;
                }
            }
            filterOnlyIncludes(nums) {
                return nums.filter(n => 0 < n && n <= this.options.length);
            }
            decideItems(nums) {
                this.status = "destroyed";
                if (!this._responseMessage) {
                    throw new Error("Search result has not been sent yet.");
                }
                return {
                    urls: nums.map(n => this.options[n - 1].url),
                    responseMessage: this._responseMessage,
                };
            }
            async destroy(option) {
                const quiet = option?.quiet || false;
                if (this.status !== "consumed")
                    return;
                if (!quiet) {
                    await this._responseMessage?.channel.createMessage({
                        content: `✅${this.t("canceling")}`,
                    }).catch(this.logger.error);
                }
                await this._responseMessage?.delete().catch(this.logger.error);
                this.status = "destroyed";
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _consumeSearchResult_decorators = [decorators_1.measureTime];
            tslib_1.__esDecorate(_a, null, _consumeSearchResult_decorators, { kind: "method", name: "consumeSearchResult", static: false, private: false, access: { has: obj => "consumeSearchResult" in obj, get: obj => obj.consumeSearchResult }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.SearchPanel = SearchPanel;
//# sourceMappingURL=searchPanel.js.map