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

import type { GuildDataContainer } from "../Structure";
import type { MusicBot } from "../bot";
import type { ComponentTypes } from "oceanic.js";
import type * as discord from "oceanic.js";

import { CommandManager } from "../Component/CommandManager";
import { CommandMessage } from "../Component/CommandMessage";
import { PageToggle } from "../Component/PageToggle";

export async function handleButtonInteraction(
  this: MusicBot,
  server: GuildDataContainer,
  interaction: discord.ComponentInteraction<ComponentTypes.BUTTON, discord.AnyGuildTextChannel>,
){
  this.logger.info("received button interaction");
  await interaction.deferUpdate();

  // コレクターで処理できるか？
  if(this.collectors.interactionCreate(interaction)){
    return;
  }

  if(interaction.data.customID === PageToggle.arrowLeft || interaction.data.customID === PageToggle.arrowRight){
    const l = this._embedPageToggle.filter(t =>
      t.Message.channelId === interaction.channel.id
      && t.Message.id === interaction.message.id);
    if(l.length >= 1){
      // ページめくり
      await l[0].flipPage(
        interaction.data.customID === PageToggle.arrowLeft ? l[0].Current >= 1 ? l[0].Current - 1 : 0
          : interaction.data.customID === PageToggle.arrowRight ? l[0].Current < l[0].Length - 1 ? l[0].Current + 1 : l[0].Current : 0
        ,
        interaction
      );
    }else{
      await interaction.editOriginal({
        content: "失敗しました!",
      });
    }
  }else if(interaction.data.customID.startsWith("cancel-last-")){
    const item = server.queue.get(server.queue.length - 1);
    const userId = interaction.data.customID.substring("cancel-last-".length);
    if(interaction.member.id === userId){
      server.queue.removeAt(server.queue.length - 1);
      interaction.createMessage({
        content: `🚮\`${item.basicInfo.title}\`の追加を取り消しました`,
      }).catch(this.logger.error);
      interaction.message.edit({
        components: [],
      }).catch(this.logger.error);
    }
  }else if(interaction.data.customID.startsWith("control_")){
    let command: string = null;
    switch(interaction.data.customID){
      case "control_rewind":
        command = "rewind";
        break;
      case "control_playpause":
        command = server.player.isPaused ? "play" : "pause";
        break;
      case "control_skip":
        command = "skip";
        break;
      case "control_onceloop":
        command = "onceloop";
        break;
      default:
        return;
    }
    const commandMessage = CommandMessage.createFromInteraction(interaction, command, [], "");
    const args = this["createCommandRunnerArgs"](commandMessage.guild.id, commandMessage.options, commandMessage.rawOptions);
    args.includeMention = true;
    CommandManager.instance.resolve(command)?.checkAndRun(commandMessage, args);
  }
}
