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

export default class Mv extends BaseCommand {
  constructor(){
    super({
      name: "移動",
      alias: ["mv", "move"],
      description: "曲を指定された位置から指定された位置までキュー内で移動します。2番目の曲を5番目に移動したい場合は`mv 2 5`のようにします。",
      unlist: false,
      category: "playlist",
      examples: "移動 2 5",
      usage: "移動 <from> <to>",
      argument: [{
        type: "integer",
        name: "from",
        description: "移動元のインデックス。キューに併記されているものです",
        required: true
      }, {
        type: "integer",
        name: "to",
        description: "移動先のインデックス。キューに併記されているものです",
        required: true
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(!Util.eris.user.isPrivileged(message.member) && !Util.eris.channel.isOnlyListener(message.member, options) && !Util.eris.user.isDJ(message.member, options)){
      message.reply("この操作を実行する権限がありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.updateBoundChannel(message);
    if(options.args.length !== 2){
      message.reply("✘引数は`移動したい曲の元のオフセット(番号) 移動先のオフセット(番号)`のように指定します。").catch(e => Util.logger.log(e, "error"));
      return;
    }else if(options.args.includes("0") && options.server.player.isPlaying){
      message.reply("✘音楽の再生中(および一時停止中)は移動元または移動先に0を指定することはできません。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const from = Number(options.args[0]);
    const to = Number(options.args[1]);
    const q = options.server.queue;
    if(
      from >= 0 && from <= q.length
      && to >= 0 && to <= q.length
    ){
      const title = q.get(from).basicInfo.Title;
      if(from !== to){
        q.move(from, to);
        message.reply("✅ `" + title + "`を`" + from + "`番目から`" + to + "`番目に移動しました").catch(e => Util.logger.log(e, "error"));
      }else{
        message.reply("✘移動元と移動先の要素が同じでした。").catch(e => Util.logger.log(e, "error"));
      }
    }else{
      message.reply("✘失敗しました。引数がキューの範囲外です").catch(e => Util.logger.log(e, "error"));
    }
  }
}
