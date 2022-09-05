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

export default class Pause extends BaseCommand {
  constructor(){
    super({
      name: "一時停止",
      alias: ["一旦停止", "停止", "pause", "stop"],
      description: "再生を一時停止します。",
      unlist: false,
      category: "player",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    // そもそも再生状態じゃないよ...
    if(!options.server.player.isPlaying){
      await message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(options.server.player.isPaused){
      await message.reply(":pause_button: すでに一時停止されています\r\n再生を再開するには`再生`コマンドを使用してください").catch(e => Util.logger.log(e, "error"));
      return;
    }
    // 停止しま～す
    options.server.player.pause();
    message.reply(":pause_button: 一時停止しました").catch(e => Util.logger.log(e, "error"));
  }
}
