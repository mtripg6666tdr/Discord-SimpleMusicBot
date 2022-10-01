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

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Rewind extends BaseCommand {
  constructor(){
    super({
      name: "頭出し",
      alias: ["rewind", "gotop", "top"],
      description: "再生中の曲の頭出しを行います。",
      unlist: false,
      category: "player",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    if(!Util.eris.user.isPrivileged(message.member) && !Util.eris.channel.sameVC(message.member, options)){
      message.reply("この操作を実行する権限がありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.updateBoundChannel(message);
    if(!options.server.player.isPlaying){
      message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
    }else{
      options.server.player.rewind();
      message.reply(":rewind:再生中の楽曲を頭出ししました:+1:").catch(e => Util.logger.log(e, "error"));
    }
  }
}
