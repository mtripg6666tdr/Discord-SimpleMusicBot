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

export default class Cancel extends BaseCommand {
  constructor(){
    super({
      name: "キャンセル",
      alias: ["cancel", "中止", "abort"],
      description: "実行中のキャンセル可能な処理がある場合それをすべて中止します。",
      unlist: false,
      category: "utility",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    if(!Util.eris.user.isPrivileged(message.member) && !Util.eris.channel.sameVC(message.member, options)){
      message.reply("この操作を実行する権限がありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.updateBoundChannel(message);
    const result = options.server.cancelAll();
    if(result){
      message.reply("処理中の処理をすべてキャンセルしています....").catch(e => Util.logger.log(e, "error"));
    }else{
      message.reply("キャンセルできる処理がありませんでした").catch(e => Util.logger.log(e, "error"));
    }
  }
}
