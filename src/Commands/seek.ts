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

export default class Seek extends BaseCommand {
  constructor(){
    super({
      name: "シーク",
      alias: ["seek"],
      description: "楽曲をシークします。",
      unlist: false,
      category: "player",
      examples: "シーク 0:30",
      usage: "検索 <時間(秒数または時間:分:秒の形式で)>",
      argument: [{
        type: "string",
        name: "keyword",
        description: "シーク先の時間",
        required: true,
      }],
      requiredPermissionsOr: ["admin", "dj"],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, context: CommandArgs){
    context.server.updateBoundChannel(message);
    const server = context.server;

    // そもそも再生状態ではない場合
    if(!server.player.isPlaying || server.player.preparing){
      await message.reply("再生中ではありません").catch(this.logger.error);
      return;
    }else if(server.player.currentAudioInfo.lengthSeconds === 0 || server.player.currentAudioInfo.isUnseekable()){
      await message.reply(":warning:シーク先に対応していない楽曲です").catch(this.logger.error);
      return;
    }

    // 引数から時間を算出
    const time = (function(rawTime){
      if(rawTime.match(/^(\d+:)*\d+$/)){
        return rawTime.split(":").map(d => Number(d))
          .reduce((prev, current) => prev * 60 + current);
      }else{
        return NaN;
      }
    }(context.rawArgs));

    if(time > server.player.currentAudioInfo.lengthSeconds || isNaN(time)){
      await message.reply(":warning:シーク先の時間が正しくありません").catch(this.logger.error);
      return;
    }

    try{
      const response = await message.reply(":rocket:シークしています...");
      server.player.stop(true);
      await server.player.play(time);
      await response.edit(":white_check_mark:シークしました").catch(this.logger.error);
    }
    catch(e){
      this.logger.error(e);
      await message.channel.createMessage({
        content: ":astonished:シークに失敗しました",
      }).catch(this.logger.error);
    }
  }
}
