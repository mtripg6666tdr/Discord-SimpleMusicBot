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
import { discordUtil } from "../Util";

export default class Skip extends BaseCommand {
  constructor(){
    super({
      alias: ["skip", "s", "playskip", "ps"],
      unlist: false,
      category: "player",
      requiredPermissionsOr: ["sameVc"],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, context: CommandArgs, t: i18n["t"]){
    const server = context.server;
    // そもそも再生状態じゃない
    if(server.player.preparing){
      message.reply(t("commands:skip.preparing")).catch(this.logger.error);
      return;
    }else if(server.player.isWaiting){
      await server.player.stop().catch(this.logger.error);
      message.reply(t("canceled")).catch(this.logger.error);
      return;
    }else if(!server.player.isPlaying){
      message.reply(t("notPlaying")).catch(this.logger.error);
      return;
    }

    try{
      const item = server.queue.get(0);
      const members = discordUtil.channels.getVoiceMember(context);
      context.server.updateBoundChannel(message);

      if(
        item.additionalInfo.addedBy.userId !== message.member.id
        && !discordUtil.users.isDJ(message.member, context)
        && !discordUtil.users.isPrivileged(message.member)
        && members && members.size > 3
      ){
        // 投票パネルを作成する
        if(!server.skipSession){
          await server.createSkipSession(message);
        }else{
          message.reply(`:red_circle:${t("commands:skip.votePanelAlreadyOpen")}`).catch(this.logger.error);
        }
        return;
      }

      await server.player.stop({ wait: true });
      await server.queue.next();

      const title = item.basicInfo.title;
      await message.reply({
        content: `${
          context.includeMention
            ? `<@${message.member.id}> `
            : ""
        }:track_next: ${t("commands:skip.success", { title })}:white_check_mark:`,
        allowedMentions: {
          users: false,
        },
      }).catch(this.logger.error);

      await server.player.play().catch(this.logger.error);

      if(server.queue.isEmpty){
        await server.player.onQueueEmpty();
      }
    }
    catch(e){
      this.logger.error(e);
      if(message.response){
        message.response.edit(`:astonished:${t("commands:skip.failed")}`).catch(this.logger.error);
      }else{
        message.channel.createMessage({
          content: `:astonished:${t("commands:skip.failed")}`,
        }).catch(this.logger.error);
      }
    }
  }
}
