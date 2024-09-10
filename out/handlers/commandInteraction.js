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
exports.handleCommandInteraction = handleCommandInteraction;
const tslib_1 = require("tslib");
const i18next_1 = tslib_1.__importDefault(require("i18next"));
const discord = tslib_1.__importStar(require("oceanic.js"));
const commandManager_1 = require("../Component/commandManager");
const CommandMessage_1 = require("../Component/commandResolver/CommandMessage");
const GuildDataContainerWithBgm_1 = require("../Structure/GuildDataContainerWithBgm");
const Util_1 = require("../Util");
async function handleCommandInteraction(server, interaction) {
    this.logger.info("received command interaction");
    if (!interaction.inCachedGuildChannel())
        return;
    if (interaction.channel.type !== discord.ChannelTypes.GUILD_TEXT
        && interaction.channel.type !== discord.ChannelTypes.PRIVATE_THREAD
        && interaction.channel.type !== discord.ChannelTypes.PUBLIC_THREAD
        && interaction.channel.type !== discord.ChannelTypes.GUILD_STAGE_VOICE
        && interaction.channel.type !== discord.ChannelTypes.GUILD_VOICE) {
        await interaction.createMessage({
            content: i18next_1.default.t("invalidChannel", { lng: interaction.locale }),
        });
        return;
    }
    // 送信可能か確認
    if (!Util_1.discordUtil.channels.checkSendable(interaction.channel, this._client.user.id)) {
        await interaction.createMessage({
            content: `:warning:${i18next_1.default.t("lackPermissions", { lng: interaction.locale })}`,
        });
        return;
    }
    // メッセージライクに解決してコマンドメッセージに
    const commandMessage = CommandMessage_1.CommandMessage.createFromInteraction(interaction);
    // コマンドを解決
    const command = commandManager_1.CommandManager.instance.resolve(commandMessage.command);
    if (!command) {
        await interaction.createMessage({
            content: `${i18next_1.default.t("commandNotFound", { lng: interaction.locale })}:sob:`,
        });
        return;
    }
    if (shouldIgnoreInteractionByBgmConfig(server, command)) {
        // BGM設定上コマンドが使えない場合、無視して返却
        return;
    }
    // プレフィックス更新
    server.updatePrefix(commandMessage);
    // コマンドを実行
    await command.checkAndRun(commandMessage, this["createCommandRunnerArgs"](commandMessage.guild.id, commandMessage.options, commandMessage.rawOptions, interaction.locale));
}
function shouldIgnoreInteractionByBgmConfig(server, command) {
    // BGM構成が存在するサーバー
    return server instanceof GuildDataContainerWithBgm_1.GuildDataContainerWithBgm
        && (
        // いまBGM再生中
        server.queue.isBGM
            && (
            // キューの編集を許可していない、またはBGM優先モード
            !server.bgmConfig.allowEditQueue || server.bgmConfig.mode === "prior")
            // BGMが再生していなければ、BGMオンリーモードであれば
            || server.bgmConfig.mode === "only")
        // かつBGM構成で制限があるときに実行できないコマンドならば
        && command.category !== "utility" && command.category !== "bot" && command.name !== "ボリューム";
}
//# sourceMappingURL=commandInteraction.js.map