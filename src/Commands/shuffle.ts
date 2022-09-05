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

export default class Shuffle extends BaseCommand {
  constructor(){
    super({
      name: "シャッフル",
      alias: ["shuffle"],
      description: "キューの内容をシャッフルします。",
      unlist: false,
      category: "playlist",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.server.queue.length === 0){
      message.reply("キューが空です。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.queue.shuffle();
    message.reply(":twisted_rightwards_arrows:シャッフルしました✅").catch(e => Util.logger.log(e, "error"));
  }
}
