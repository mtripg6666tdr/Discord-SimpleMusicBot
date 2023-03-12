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

export default class Mv extends BaseCommand {
  constructor(){
    super({
      alias: ["move", "mv"],
      unlist: false,
      category: "playlist",
      argument: [
        {
          type: "integer",
          name: "from",
          required: true,
        },
        {
          type: "integer",
          name: "to",
          required: true,
        },
      ],
      requiredPermissionsOr: ["admin", "onlyListener", "dj"],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, context: CommandArgs){
    context.server.updateBoundChannel(message);

    if(context.args.length !== 2){
      message.reply("✘引数は`移動したい曲の元のオフセット(番号) 移動先のオフセット(番号)`のように指定します。").catch(this.logger.error);
      return;
    }else if(context.args.includes("0") && context.server.player.isPlaying){
      message.reply("✘音楽の再生中(および一時停止中)は移動元または移動先に0を指定することはできません。").catch(this.logger.error);
      return;
    }

    const from = Number(context.args[0]);
    const to = Number(context.args[1]);
    const q = context.server.queue;

    if(
      from >= 0 && from <= q.length
      && to >= 0 && to <= q.length
    ){
      const title = q.get(from).basicInfo.title;
      if(from !== to){
        q.move(from, to);
        message.reply(`✅ \`${title}\`を\`${from}\`番目から\`${to}\`番目に移動しました`)
          .catch(this.logger.error);
      }else{
        message.reply("✘移動元と移動先の要素が同じでした。")
          .catch(this.logger.error);
      }
    }else{
      message.reply("✘失敗しました。引数がキューの範囲外です")
        .catch(this.logger.error);
    }
  }
}
