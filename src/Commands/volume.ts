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
import type { CommandMessage } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import Util from "../Util";

export default class Volume extends BaseCommand {
  constructor(){
    super({
      name: "ボリューム",
      alias: ["volume", "vol"],
      description: "音量を調節します。1から200の間で指定します(デフォルト100)。何も引数を付けないと現在の音量を表示します。不安定になった場合には100に戻してください。",
      unlist: false,
      category: "voice",
      examples: "volume [音量]",
      usage: "volume 120",
      argument: [{
        type: "integer",
        name: "volume",
        description: "変更先の音量。20~200までが指定できます。",
        required: false
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.rawArgs === ""){
      await message.reply(`:loud_sound:現在の音量は**${options.server.player.volume}**です(デフォルト:100)`)
        .catch(e => Util.logger.log(e, "error"))
      ;
      return;
    }
    const newval = Number(options.rawArgs);
    if(isNaN(newval) || newval < 1 || newval > 200){
      message.reply(":bangbang:音量を変更する際は1から200の数字で指定してください。")
        .catch(e => Util.logger.log(e, "error"));
      return;
    }
    const result = options.server.player.setVolume(newval);
    await message.reply(`:loud_sound:音量を**${newval}**に変更しました。\r\n${options.server.player.isPlaying && !result ? "次の曲から適用されます。現在再生中の曲に設定を適用するには、`頭出し`コマンドなどを使用してください。" : ""}`)
      .catch(e => Util.logger.log(e, "error"));
  }
}
