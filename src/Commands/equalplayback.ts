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

export default class EquallyPlayback extends BaseCommand {
  constructor(){
    super({
      alias: ["equalplayback", "equallyplayback", "eqpb", "equal", "equally"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: ["admin", "noConnection", "onlyListener", "dj"],
      shouldDefer: false,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(command: CommandMessage, context: CommandArgs){
    const { t } = context;

    if(context.server.preferences.equallyPlayback){
      context.server.preferences.equallyPlayback = false;
      command.reply(`❌${t("commands:equalplayback.disabled")}`).catch(this.logger.error);
    }else{
      context.server.preferences.equallyPlayback = true;
      const embed = new MessageEmbedBuilder()
        .setTitle(`⭕${t("commands:equalplayback.enabled")}`)
        .setDescription(t("commands:equalplayback.featureDescription"))
        .setColor(getColor("EQUALLY"))
        .toOceanic()
      ;
      command.reply({ embeds: [embed] }).catch(this.logger.error);
      context.server.queue.sortByAddedBy();
    }
  }
}
