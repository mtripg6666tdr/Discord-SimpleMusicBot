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

export default class Mltf extends BaseCommand {
  constructor(){
    super({
      name: "最後の曲を先頭へ",
      alias: ["movelastsongtofirst", "mlstf", "ml", "mltf", "mlf", "m1"],
      description: "キューの最後の曲をキューの先頭に移動します。",
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
    if(options.server.queue.length <= 2){
      message.reply("キューに3曲以上追加されているときに使用できます。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const q = options.server.queue;
    const to = options.server.player.isPlaying ? 1 : 0;
    q.move(q.length - 1, to);
    const info = q.get(to);
    message.reply("✅`" + info.basicInfo.Title + "`を一番最後からキューの先頭に移動しました").catch(e => Util.logger.log(e, "error"));
  }
}
