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

export default class Loop extends BaseCommand {
  constructor(){
    super({
      name: "ループ",
      alias: ["トラックループ", "loop", "repeat", "lp", "trackloop", "trackrepeat"],
      description: "トラックごとのループを設定します。",
      unlist: false,
      category: "player",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(!Util.eris.user.isPrivileged(message.member) && options.server.player.isConnecting && !Util.eris.channel.isOnlyListener(message.member, options) && !Util.eris.user.isDJ(message.member, options)){
      message.reply("この操作を実行する権限がありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.updateBoundChannel(message);
    if(options.server.queue.loopEnabled){
      options.server.queue.loopEnabled = false;
      message.reply(":repeat_one:トラックリピートを無効にしました:x:").catch(e => Util.logger.log(e, "error"));
    }else{
      options.server.queue.loopEnabled = true;
      message.reply(":repeat_one:トラックリピートを有効にしました:o:").catch(e => Util.logger.log(e, "error"));
    }
  }
}
