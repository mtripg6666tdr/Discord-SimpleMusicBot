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
import * as Util from "../Util";
import { getColor } from "../Util/color";

export default class Uptime extends BaseCommand {
  constructor(){
    super({
      alias: ["uptime"],
      unlist: false,
      category: "utility",
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, context: CommandArgs){
    const { t } = context;
    const now = Date.now();
    const insta = Util.time.calcTime(now - context.bot.instantiatedTime!.getTime());
    const ready = Util.time.calcTime(context.client.uptime);
    const embed = new MessageEmbedBuilder()
      .setColor(getColor("UPTIME"))
      .setTitle(t("commands:uptime.embedTitle", { name: context.client.user.username }))
      .addField(
        t("commands:uptime.elapsedAfterInstantiated"),
        t("commands:uptime.datetimeLabel", { hour: insta[0], min: insta[1], sec: insta[2] })
      )
      .addField(
        t("commands:uptime.elapsedAfterConnected"),
        t("commands:uptime.datetimeLabel", { hour: ready[0], min: ready[1], sec: ready[2] })
      )
      .addField(
        t("commands:uptime.registeredServerCount"),
        t("commands:uptime.serverCount", { count: context.bot.databaseCount })
      )
      .setTimestamp(Date.now())
      .setAuthor({
        iconURL: context.client.user.avatarURL(),
        name: context.client.user.username,
      })
      .toOceanic()
    ;
    message.reply({ embeds: [embed] }).catch(this.logger.error);
  }
}
