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

import type { MusicBot } from "../bot";

import * as discord from "oceanic.js";
import { InteractionTypes } from "oceanic.js";

import Util from "../Util";
import * as handlers from "../handlers";

export async function onInteractionCreate(this: MusicBot, interaction: discord.AnyInteractionGateway){
  // イベント発生させる
  this["_addOn"].emit("interactionCreate", interaction);

  // コマンドインタラクションおよびコンポーネントインタラクション以外は処理せず終了
  if(interaction.type !== InteractionTypes.APPLICATION_COMMAND && interaction.type !== InteractionTypes.MESSAGE_COMPONENT){
    this.Log(`Unknown interaction received: ${interaction.type}`, "debug");
    return;
  }
  // メンテナンスモードでかつボット管理者以外なら終了
  if(this.maintenance && !Util.general.isBotAdmin(interaction.member.id)){
    if(Util.config.debug) this.Log("Interaction ignored due to mentenance mode", "debug");
    return;
  }
  // ボットによるインタラクション（の可能性があるのかは知らないけど）なら終了
  if(interaction.member?.bot){
    return;
  }
  // レートリミットしてるなら終了
  if(this.rateLimitController.isRateLimited(interaction.member.id)){
    return;
  }

  // データ初期化
  const channel = interaction.channel as discord.TextChannel;
  const server = this.initData(channel.guild.id, channel.id);

  // コマンドインタラクション
  if(interaction instanceof discord.CommandInteraction){
    handlers.handleCommandInteraction.call(this, server, interaction);
  }else if(interaction instanceof discord.ComponentInteraction){
    if(!(interaction.channel instanceof discord.TextChannel)){
      return;
    }

    if(Util.eris.interaction.componentInteractionDataIsButtonData(interaction.data)){
      // ボタンインタラクション
      handlers.handleButtonInteraction.call(this, server, interaction);
    }else if(Util.eris.interaction.componentInteractionDataIsSelectMenuData(interaction.data)){
      // セレクトメニューインタラクション
      handlers.handleSelectMenuInteraction.call(this, server, interaction);
    }
  }
}
