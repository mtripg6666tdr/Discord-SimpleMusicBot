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
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Skip extends BaseCommand {
  constructor(){
    super({
      name: "スキップ",
      alias: ["skip", "s"],
      description: "現在再生中の曲をスキップします。",
      unlist: false,
      category: "player",
      permissionDescription: "削除対象の楽曲を追加した人。要件を満たしていなければ投票を開始します"
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    const server = options.server;
    // そもそも再生状態じゃないよ...
    if(!server.player.isPlaying){
      message.reply("再生中ではありません").catch(e => Util.logger.log(Util.general.StringifyObject(e), "error"));
      return;
    }else if(server.player.preparing){
      message.reply("再生準備中です").catch(e => Util.logger.log(Util.general.StringifyObject(e), "error"));
      return;
    }
    try{
      const item = server.queue.get(0);
      const members = Util.eris.channel.getVoiceMember(options);
      if(!members.has(message.member.id)){
        message.reply("この操作を実行する権限がありません");
        return;
      }
      if(item.additionalInfo.addedBy.userId !== message.member.id && !Util.eris.user.isPrivileged(message.member) && members.size > 3){
        if(!server.skipSession){
          await server.createSkipSession(message);
        }else{
          message.reply(":red_circle: すでに開かれている投票パネルがあります");
        }
        return;
      }
      const title = item.basicInfo.Title;
      server.player.stop();
      await server.queue.next();
      await server.player.play();
      await message.reply({
        content: `${options.includeMention ? `<@${message.member.id}> ` : ""}:track_next: \`${title}\`をスキップしました:white_check_mark:`,
        allowedMentions: {
          users: false,
        },
      }).catch(e => Util.logger.log(e, "error"));
    }
    catch(e){
      Util.logger.log(e, "error");
      if(message.response){
        message.response.edit(":astonished:スキップに失敗しました").catch(er => Util.logger.log(er, "error"));
      }else{
        message.channel.createMessage(":astonished:スキップに失敗しました").catch(er => Util.logger.log(er, "error"));
      }
    }
  }
}
