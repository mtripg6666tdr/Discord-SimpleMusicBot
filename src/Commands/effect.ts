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

import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/commandResolver/CommandMessage";

import { MessageActionRowBuilder, MessageButtonBuilder, MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import { getColor } from "../Util/color";

export default class Effect extends BaseCommand {
  constructor(){
    super({
      alias: ["effect", "音声エフェクト", "音声効果", "効果"],
      unlist: false,
      category: "player",
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, context: CommandArgs){
    context.server.updateBoundChannel(message);
    try{
      const { collector, customIdMap } = context.server.bot.collectors.create()
        .setAuthorIdFilter(message.member.id)
        .setMaxInteraction(Infinity)
        .setTimeout(5 * 60 * 1000)
        .createCustomIds({
          reload: "button",
          bassBoost: "button",
          reverb: "button",
          loudnessEq: "button",
        });
      const createEffectEmbed = () => new MessageEmbedBuilder()
        .setTitle(":cd:エフェクトコントロールパネル:microphone:")
        .setDescription("オーディオエフェクトの設定/解除することができます。\r\n・表示は古い情報であることがありますが、エフェクトを操作したとき、更新ボタンを押したときに更新されます。\r\n・エフェクトは次の曲から適用されます\r\n現在の曲に適用したい場合は、`頭出し`コマンドを使用してください\r\n")
        .addField("Bass Boost", context.server.effectPrefs.BassBoost ? "⭕" : "❌", true)
        .addField("Reverb", context.server.effectPrefs.Reverb ? "⭕" : "❌", true)
        .addField("Loudness Eq", context.server.effectPrefs.LoudnessEqualization ? "⭕" : "❌", true)
        .setColor(getColor("EFFECT"))
        .setFooter({
          iconURL: message.member.avatarURL(),
          text: "エフェクトを選択してボタンを押してください",
        })
        .toOceanic()
      ;
      const createActionRow = () => new MessageActionRowBuilder()
        .addComponents(
          new MessageButtonBuilder()
            .setCustomId(customIdMap.reload)
            .setStyle("PRIMARY")
            .setEmoji("🔁")
            .setLabel("更新"),
          new MessageButtonBuilder()
            .setCustomId(customIdMap.bassBoost)
            .setStyle(context.server.effectPrefs.BassBoost ? "SUCCESS" : "SECONDARY")
            .setLabel("Bass Boost"),
          new MessageButtonBuilder()
            .setCustomId(customIdMap.reverb)
            .setStyle(context.server.effectPrefs.Reverb ? "SUCCESS" : "SECONDARY")
            .setLabel("Reverb"),
          new MessageButtonBuilder()
            .setCustomId(customIdMap.loudnessEq)
            .setStyle(context.server.effectPrefs.LoudnessEqualization ? "SUCCESS" : "SECONDARY")
            .setLabel("Loudness Eq")
        )
        .toOceanic();
      
      const reply = await message.reply({
        embeds: [createEffectEmbed()],
        components: [createActionRow()],
      });
      const updateEffectEmbed = () => {
        reply.edit({
          embeds: [createEffectEmbed()],
          components: [createActionRow()],
        });
      };
      collector
        .on("reload", updateEffectEmbed)
        .on("bassBoost", () => {
          context.server.effectPrefs.BassBoost = !context.server.effectPrefs.BassBoost;
          updateEffectEmbed();
        })
        .on("reverb", () => {
          context.server.effectPrefs.Reverb = !context.server.effectPrefs.Reverb;
          updateEffectEmbed();
        })
        .on("loudnessEq", () => {
          context.server.effectPrefs.LoudnessEqualization = !context.server.effectPrefs.LoudnessEqualization;
          updateEffectEmbed();
        });
    }
    catch(e){
      this.logger.error(e);
      message.reply(":cry:エラーが発生しました").catch(this.logger.error);
    }
  }
}
