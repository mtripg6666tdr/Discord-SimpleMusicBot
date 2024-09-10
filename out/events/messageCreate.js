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
exports.onMessageCreate = onMessageCreate;
const tslib_1 = require("tslib");
const i18next_1 = tslib_1.__importDefault(require("i18next"));
const discord = tslib_1.__importStar(require("oceanic.js"));
const commandManager_1 = require("../Component/commandManager");
const CommandMessage_1 = require("../Component/commandResolver/CommandMessage");
const GuildDataContainerWithBgm_1 = require("../Structure/GuildDataContainerWithBgm");
const Util_1 = require("../Util");
const config_1 = require("../config");
const config = (0, config_1.getConfig)();
async function onMessageCreate(message) {
    if (this.maintenance && !config.isBotAdmin(message.author.id)) {
        return;
    }
    if (!this["_isReadyFinished"] || message.author.bot || !message.channel || !message.member || !message.inCachedGuildChannel()) {
        return;
    }
    if (message.channel.type !== discord.ChannelTypes.GUILD_TEXT
        && message.channel.type !== discord.ChannelTypes.PRIVATE_THREAD
        && message.channel.type !== discord.ChannelTypes.PUBLIC_THREAD
        && message.channel.type !== discord.ChannelTypes.GUILD_STAGE_VOICE
        && message.channel.type !== discord.ChannelTypes.GUILD_VOICE) {
        return;
    }
    if (this._rateLimitController.isLimited(message.member.id)) {
        return;
    }
    // データ初期化
    const server = this.upsertData(message.guildID, message.channel.id);
    // プレフィックスの更新
    server.updatePrefix(message);
    if (message.content === this.mentionText) {
        if (this._rateLimitController.pushEvent(message.member.id)) {
            return;
        }
        // メンションならば
        await message.channel.createMessage({
            content: `${i18next_1.default.t("mentionHelp", { lng: server.locale })}\r\n`
                + (config.noMessageContent
                    ? ""
                    : i18next_1.default.t("mentionHelpPrefix", { prefix: server.prefix, lng: server.locale })),
        })
            .catch(this.logger.error);
        return;
    }
    const prefix = server.prefix;
    const messageContent = (0, Util_1.normalizeText)(message.content);
    if (messageContent.startsWith(prefix) && messageContent.length > prefix.length) {
        if (this._rateLimitController.pushEvent(message.member.id)) {
            return;
        }
        // コマンドメッセージを作成
        const commandMessage = CommandMessage_1.CommandMessage.createFromMessage(message, prefix.length);
        // コマンドを解決
        const command = commandManager_1.CommandManager.instance.resolve(commandMessage.command);
        if (!command)
            return;
        if (
        // BGM構成が存在するサーバー
        server instanceof GuildDataContainerWithBgm_1.GuildDataContainerWithBgm
            && (
            // いまBGM再生中
            server.queue.isBGM
                && (
                // キューの編集を許可していない、またはBGM優先モード
                !server.bgmConfig.allowEditQueue || server.bgmConfig.mode === "prior")
                // BGMが再生していなければ、BGMオンリーモードであれば
                || server.bgmConfig.mode === "only")
            // かつBGM構成で制限があるときに実行できないコマンドならば
            && command.category !== "utility" && command.category !== "bot" && command.name !== "ボリューム") {
            // 無視して返却
            return;
        }
        // 送信可能か確認
        if (!Util_1.discordUtil.channels.checkSendable(message.channel, this._client.user.id)) {
            try {
                await message.channel.createMessage({
                    messageReference: {
                        messageID: message.id,
                    },
                    content: i18next_1.default.t("lackPermissions", { lng: server.locale }),
                    allowedMentions: {
                        repliedUser: false,
                    },
                });
            }
            catch { /* empty */ }
            return;
        }
        // コマンドの処理
        await command.checkAndRun(commandMessage, this["createCommandRunnerArgs"](commandMessage.guild.id, commandMessage.options, commandMessage.rawOptions, server.locale));
    }
    else if (server.searchPanel.has(message.member.id)) {
        // searchコマンドのキャンセルを捕捉
        const panel = server.searchPanel.get(message.member.id);
        const content = (0, Util_1.normalizeText)(message.content);
        if (message.content === "キャンセル"
            || message.content === "cancel"
            || message.content === i18next_1.default.t("cancel", { lng: server.locale })) {
            await panel.destroy();
        }
        // searchコマンドの選択を捕捉
        else if (content.match(/^([0-9]\s?)+$/)) {
            // メッセージ送信者が検索者と一致するかを確認
            const nums = content.split(" ");
            await server.playFromSearchPanelOptions(nums, panel);
        }
    }
    else if (message.content === "キャンセル"
        || message.content === "cancel"
        || message.content === i18next_1.default.t("cancel", { lng: server.locale })) {
        const result = server.cancelAll();
        if (!result)
            return;
        await message.channel.createMessage({
            messageReference: {
                messageID: message.id,
            },
            content: "処理中の処理をすべてキャンセルしています....",
        })
            .catch(this.logger.error);
    }
}
//# sourceMappingURL=messageCreate.js.map