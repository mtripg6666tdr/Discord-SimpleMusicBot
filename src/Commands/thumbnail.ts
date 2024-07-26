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

import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/commandResolver/CommandMessage";

import { MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";


import { BaseCommand } from ".";
import { getColor } from "../Util/color";

export default class Thumbnail extends BaseCommand {
  constructor(){
    super({
      alias: ["サムネ", "thumbnail", "thumb", "t"],
      unlist: false,
      category: "player",
      args: [{
        type: "integer",
        name: "index",
        required: false,
      }],
      requiredPermissionsOr: [],
      shouldDefer: false,
      usage: true,
      examples: true,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs){
    const { t } = context;

    const embed = new MessageEmbedBuilder()
      .setColor(getColor("THUMB"));

    const userSearchPanel = context.server.searchPanel.get(message.member.id);
    const rawArgNumber = Number(context.rawArgs);
    if(context.rawArgs && userSearchPanel && 0 < rawArgNumber && rawArgNumber <= userSearchPanel.options.length){
      // 検索パネルからのサムネイル
      const opt = userSearchPanel.options[rawArgNumber - 1];
      embed
        .setImage(opt.thumbnail)
        .setTitle(opt.title)
        .setDescription(`URL: ${opt.url}`);
    }else if(!context.rawArgs && context.server.player.isPlaying && context.server.queue.length >= 1){
      // 現在再生中楽曲のサムネイル
      const { basicInfo: info } = context.server.queue.get(0);
      embed.setTitle(info.title);

      if(!info.isPrivateSource){
        embed.setDescription(`URL: ${info.url}`);
      }

      if(typeof info.thumbnail === "string"){
        embed.setImage(info.thumbnail);
        await message.reply({
          embeds: [embed.toOceanic()],
        }).catch(this.logger.error);
      }else{
        embed.setImage(`attachment://thumbnail.${info.thumbnail.ext}`);
        await message.reply({
          embeds: [embed.toOceanic()],
          files: [
            {
              name: `thumbnail.${info.thumbnail.ext}`,
              contents: info.thumbnail.data,
            },
          ],
        }).catch(this.logger.error);
      }
    }else{
      message.reply(`✘${t("commands:thumbnail.noSearchPanelFound")}`).catch(this.logger.error);
      return;
    }

    await message.reply({
      embeds: [embed.toOceanic()],
    }).catch(this.logger.error);
  }
}
