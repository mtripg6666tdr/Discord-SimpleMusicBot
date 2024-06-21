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

import type { BaseCommand } from "../Commands";
import type { GuildDataContainer } from "../Structure";
import type { MusicBot } from "../bot";

import i18next from "i18next";
import * as discord from "oceanic.js";

import { CommandManager } from "../Component/commandManager";
import { CommandMessage } from "../Component/commandResolver/CommandMessage";
import { GuildDataContainerWithBgm } from "../Structure/GuildDataContainerWithBgm";
import { discordUtil } from "../Util";

export async function handleCommandInteraction(this: MusicBot, server: GuildDataContainer, interaction: discord.CommandInteraction){
  this.logger.info("received command interaction");
  if(!interaction.inCachedGuildChannel()) return;

  if(
    interaction.channel.type !== discord.ChannelTypes.GUILD_TEXT
    && interaction.channel.type !== discord.ChannelTypes.PRIVATE_THREAD
    && interaction.channel.type !== discord.ChannelTypes.PUBLIC_THREAD
    && interaction.channel.type !== discord.ChannelTypes.GUILD_STAGE_VOICE
    && interaction.channel.type !== discord.ChannelTypes.GUILD_VOICE
  ){
    await interaction.createMessage({
      content: i18next.t("invalidChannel", { lng: interaction.locale }),
    });
    return;
  }

  // 送信可能か確認
  if(!discordUtil.channels.checkSendable(interaction.channel, this._client.user.id)){
    await interaction.createMessage({
      content: `:warning:${i18next.t("lackPermissions", { lng: interaction.locale })}`,
    });
    return;
  }

  // メッセージライクに解決してコマンドメッセージに
  const commandMessage = CommandMessage.createFromInteraction(interaction);
  // コマンドを解決
  const command = CommandManager.instance.resolve(commandMessage.command);
  if(!command){
    await interaction.createMessage({
      content: `${i18next.t("commandNotFound", { lng: interaction.locale })}:sob:`,
    });
    return;
  }

  if(shouldIgnoreInteractionByBgmConfig(server, command)){
    // BGM設定上コマンドが使えない場合、無視して返却
    return;
  }

  // プレフィックス更新
  server.updatePrefix(commandMessage);
  // コマンドを実行
  await command.checkAndRun(
    commandMessage,
    this["createCommandRunnerArgs"](
      commandMessage.guild.id,
      commandMessage.options,
      commandMessage.rawOptions,
      interaction.locale
    )
  );
}

function shouldIgnoreInteractionByBgmConfig(server: GuildDataContainer, command: BaseCommand){
  // BGM構成が存在するサーバー
  return server instanceof GuildDataContainerWithBgm
    && (
      // いまBGM再生中
      server.queue.isBGM
        && (
          // キューの編集を許可していない、またはBGM優先モード
          !server.bgmConfig.allowEditQueue || server.bgmConfig.mode === "prior"
        )
      // BGMが再生していなければ、BGMオンリーモードであれば
      || server.bgmConfig.mode === "only"
    )
    // かつBGM構成で制限があるときに実行できないコマンドならば
    && command.category !== "utility" && command.category !== "bot" && command.name !== "ボリューム";
}
