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
import type { i18n } from "i18next";

import { BaseCommand } from ".";

export default class LeaveClean extends BaseCommand {
  constructor(){
    super({
      alias: ["leaveclean", "lc", "leavecleanup"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: ["admin", "onlyListener", "dj"],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, context: CommandArgs, t: i18n["t"]){
    context.server.updateBoundChannel(message);

    if(!context.server.player.isConnecting){
      context.server.queue.removeAll();
      message.reply(`✅${t("commands:leaveclean.allRemoved")}`).catch(this.logger.error);
      return;
    }else if(context.server.queue.length === 0){
      message.reply(t("commands:leaveclean.queueEmpty")).catch(this.logger.error);
      return;
    }

    const memberIds = context.server.connectingVoiceChannel!.voiceMembers.map(member => member.id);
    const removed = context.server.queue.removeIf(q => !memberIds.includes(q.additionalInfo.addedBy.userId)).length;
    await message.reply(
      removed >= 1
        ? `✅${t("commands:leaveclean.removed", { count: removed })}`
        : t("commands:leaveclean.removedNothing")
    ).catch(this.logger.error);
  }
}
