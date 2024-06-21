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

import { BaseCommand } from ".";

export default class Mv extends BaseCommand {
  constructor(){
    super({
      alias: ["move", "mv"],
      unlist: false,
      category: "playlist",
      args: [
        {
          type: "integer",
          name: "from",
          required: true,
        },
        {
          type: "integer",
          name: "to",
          required: true,
        },
      ],
      requiredPermissionsOr: ["admin", "onlyListener", "dj"],
      shouldDefer: false,
      examples: true,
      usage: true,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs){
    const { t } = context;

    if(context.args.length !== 2){
      message.reply(`✘${t("commands:move.invalidArgumentCount")}`).catch(this.logger.error);
      return;
    }else if(context.args.includes("0") && context.server.player.isPlaying){
      message.reply(`✘${t("commands:move.invalidIndex")}`).catch(this.logger.error);
      return;
    }

    const from = Number(context.args[0]);
    const to = Number(context.args[1]);
    const q = context.server.queue;

    if(
      from >= 0 && from <= q.length
      && to >= 0 && to <= q.length
    ){
      const title = q.get(from).basicInfo.title;
      if(from !== to){
        q.move(from, to);
        message.reply(`✅${t("commands:move.moved", { title, from, to })}`)
          .catch(this.logger.error);
      }else{
        message.reply(`✘${t("commands:move.originEqualsDestination")}`)
          .catch(this.logger.error);
      }
    }else{
      message.reply(`✘${t("commands:move.indexOutOfRange")}`)
        .catch(this.logger.error);
    }
  }
}
