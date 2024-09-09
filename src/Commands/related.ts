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

export default class Related extends BaseCommand {
  constructor() {
    super({
      alias: ["関連曲", "おすすめ", "オススメ", "related", "relatedsong", "r", "recommend"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: false,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    if (context.server.preferences.addRelated) {
      context.server.preferences.addRelated = false;
      message.reply(`❌${t("commands:related.disabled")}`).catch(this.logger.error);
    } else {
      context.server.preferences.addRelated = true;
      const embed = new MessageEmbedBuilder()
        .setTitle(`⭕${t("commands:related.enabled")}`)
        .setDescription(`${t("commands:related.featureDescription")}\r\n${t("commands:related.featureNote")}`)
        .setColor(getColor("RELATIVE_SETUP"))
        .toOceanic()
      ;
      message.reply({ embeds: [embed] }).catch(this.logger.error);
    }
  }
}
