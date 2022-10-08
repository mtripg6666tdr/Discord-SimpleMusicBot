/*
 * Copyright 2021-2022 mtripg6666tdr
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
import type { VoiceChannel } from "eris";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class LeaveClean extends BaseCommand {
  constructor(){
    super({
      name: "キューを整理",
      alias: ["lc", "leaveclean"],
      description: "ボイスチャンネルから離脱した人がリクエストした曲をキューから削除して整理します",
      unlist: false,
      category: "playlist",
      permissionDescription: "DJロール",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(!Util.eris.user.isPrivileged(message.member) && !Util.eris.channel.isOnlyListener(message.member, options) && !Util.eris.user.isDJ(message.member, options)){
      message.reply("この操作を実行する権限がありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.updateBoundChannel(message);
    if(!options.server.player.isConnecting){
      options.server.queue.removeAll();
      message.reply("✅すべて削除しました").catch(e => Util.logger.log(e, "error"));
      return;
    }else if(options.server.queue.length === 0){
      message.reply("キューが空です").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const members = (options.client.getChannel(options.server.connection.channelID) as VoiceChannel).voiceMembers.map(member => member.id);
    const number = options.server.queue.removeIf(q => !members.includes(q.additionalInfo.addedBy.userId)).length;
    await message.reply(number >= 1 ? "✅" + number + "曲削除しました。" : "削除するものはありませんでした。").catch(e => Util.logger.log(e, "error"));
  }
}
