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

export default class End extends BaseCommand {
  constructor(){
    super({
      name: "この曲で終了",
      alias: ["end"],
      description: "現在再生中の曲(再生待ちの曲)をのぞいてほかの曲をすべて削除します",
      unlist: false,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(!Util.eris.user.isPrivileged(message.member) && !Util.eris.channel.isOnlyListener(message.member, options) && !Util.eris.user.isDJ(message.member, options)){
      message.reply("この操作を実行する権限がありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.updateBoundChannel(message);
    if(!options.server.player.isPlaying){
      message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(options.server.queue.length <= 1){
      message.reply("キューが空、もしくは一曲しかないため削除されませんでした。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.queue.removeFrom2nd();
    options.server.queue.queueLoopEnabled = options.server.queue.onceLoopEnabled = options.server.queue.loopEnabled = false;
    message.reply("✅キューに残された曲を削除しました").catch(e => Util.logger.log(e, "error"));
  }
}
