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

  async run(message: CommandMessage, context: CommandArgs){
    const server = context.server;
    // そもそも再生状態じゃないよ...
    if(server.player.preparing){
      message.reply("再生準備中です").catch(this.logger.error);
      return;
    }else if(!server.player.isPlaying){
      message.reply("再生中ではありません").catch(this.logger.error);
      return;
    }

    try{
      const item = server.queue.get(0);
      const members = discordUtil.channels.getVoiceMember(context);
      context.server.updateBoundChannel(message);

      if(
        item.additionalInfo.addedBy.userId !== message.member.id
        && !discordUtil.users.isDJ(message.member, context)
        && !discordUtil.users.isPrivileged(message.member) && members.size > 3
      ){
        // 投票パネルを作成する
        if(!server.skipSession){
          await server.createSkipSession(message);
        }else{
          message.reply(":red_circle: すでに開かれている投票パネルがあります");
        }
        return;
      }

      const title = item.basicInfo.title;
      server.player.stop(true);
      await server.queue.next();
      await server.player.play();
      await message.reply({
        content: `${context.includeMention ? `<@${message.member.id}> ` : ""}:track_next: \`${title}\`をスキップしました:white_check_mark:`,
        allowedMentions: {
          users: false,
        },
      }).catch(this.logger.error);
      if(server.queue.isEmpty){
        await server.player.onQueueEmpty();
      }
    }
    catch(e){
      this.logger.error(e);
      if(message.response){
        message.response.edit(":astonished:スキップに失敗しました").catch(this.logger.error);
      }else{
        message.channel.createMessage({
          content: ":astonished:スキップに失敗しました",
        }).catch(this.logger.error);
      }
    }
  }
}
