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

import * as discord from "eris";

import { CommandManager } from "../Component/CommandManager";
import { CommandMessage } from "../Component/CommandMessage";
import { PageToggle } from "../Component/PageToggle";
import Util from "../Util";

export async function handleButtonInteraction(
  this: MusicBot,
  server: GuildDataContainer,
  interaction: Omit<discord.ComponentInteraction<discord.TextChannel>, "data"> & { data: discord.ComponentInteractionButtonData }
){
  this.Log("received button interaction");
  await interaction.deferUpdate();
  if(interaction.data.custom_id === PageToggle.arrowLeft || interaction.data.custom_id === PageToggle.arrowRight){
    const l = this._embedPageToggle.filter(t =>
      t.Message.channelId === interaction.channel.id
      && t.Message.id === interaction.message.id);
    if(l.length >= 1){
      // ページめくり
      await l[0].flipPage(
        interaction.data.custom_id === PageToggle.arrowLeft ? l[0].Current >= 1 ? l[0].Current - 1 : 0 :
          interaction.data.custom_id === PageToggle.arrowRight ? l[0].Current < l[0].Length - 1 ? l[0].Current + 1 : l[0].Current : 0
        ,
        interaction
      );
    }else{
      await interaction.editOriginalMessage("失敗しました!");
    }
  }else if(interaction.data.custom_id.startsWith("skip_vote")){
    const result = server.skipSession?.vote(interaction.member);
    if(result === "voted"){
      interaction.createMessage({
        content: "投票しました",
        flags: discord.Constants.MessageFlags.EPHEMERAL,
      });
    }else if(result === "cancelled"){
      interaction.createMessage({
        content: "投票を取り消しました",
        flags: discord.Constants.MessageFlags.EPHEMERAL,
      });
    }
  }else if(interaction.data.custom_id.startsWith("cancel-last-")){
    const item = server.queue.get(server.queue.length - 1);
    const userId = interaction.data.custom_id.substring("cancel-last-".length);
    if(interaction.member.id === userId){
      server.queue.removeAt(server.queue.length - 1);
      interaction.createMessage(`🚮\`${item.basicInfo.Title}\`の追加を取り消しました`).catch(er => this.Log(er, "error"));
      interaction.message.edit({
        components: [],
      }).catch(er => this.Log(er, "error"));
    }
  }else if(interaction.data.custom_id.startsWith("cancel-search-")){
    const userId = interaction.data.custom_id.substring("cancel-search-".length);
    if(interaction.member.id === userId && this.guildData.get(interaction.guildID)?.hasSearchPanel(userId)){
      this.guildData.get(interaction.guildID)
        .getSearchPanel(userId)
        .destroy(/* quiet */ true)
      ;
      interaction.createMessage("🚮検索パネルを破棄しました:white_check_mark:").catch(er => this.Log(er, "error"));
      interaction.message.edit({
        components: [],
      }).catch(er => this.Log(er, "error"));
    }
  }else if(interaction.data.custom_id.startsWith("control_")){
    let command: string = null;
    switch(interaction.data.custom_id){
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
    const commandMessage = CommandMessage.createFromInteraction(interaction as discord.ComponentInteraction<discord.GuildTextableWithThread>, command, [], "") as CommandMessage;
    const args = this["createCommandRunnerArgs"](commandMessage.guild.id, commandMessage.options, commandMessage.rawOptions);
    args.includeMention = true;
    CommandManager.instance.resolve(command)?.checkAndRun(commandMessage, args);
  }else{
    const updateEffectPanel = () => {
      const mes = interaction.message;
      const { embed, messageActions } = Util.effects.getCurrentEffectPanel(interaction.member.avatarURL, this.guildData.get(interaction.channel.guild.id));
      mes.edit({
        content: "",
        embeds: [embed.toEris()],
        components: [messageActions],
      }).catch(er => Util.logger.log(er, "error"));
    };
    switch(interaction.data.custom_id){
      case Util.effects.EffectsCustomIds.Reload:
        updateEffectPanel();
        break;
      case Util.effects.EffectsCustomIds.BassBoost:
        this.guildData.get(interaction.channel.guild.id).effectPrefs.BassBoost = !server.effectPrefs.BassBoost;
        updateEffectPanel();
        break;
      case Util.effects.EffectsCustomIds.Reverb:
        this.guildData.get(interaction.channel.guild.id).effectPrefs.Reverb = !server.effectPrefs.Reverb;
        updateEffectPanel();
        break;
      case Util.effects.EffectsCustomIds.LoudnessEqualization:
        this.guildData.get(interaction.channel.guild.id).effectPrefs.LoudnessEqualization = !server.effectPrefs.LoudnessEqualization;
        updateEffectPanel();
        break;
    }
  }
}
