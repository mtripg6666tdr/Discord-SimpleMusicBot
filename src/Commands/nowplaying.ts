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

import { MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import * as Util from "../Util";
import { getColor } from "../Util/color";

export default class NowPlaying extends BaseCommand {
  constructor(){
    super({
      name: "現在再生中",
      alias: ["今の曲", "nowplaying", "np"],
      description: "現在再生中の曲の情報を表示します。 `l`(スラッシュコマンドの場合はTrue)を引数にするとより長く概要を表示します(可能な場合)",
      unlist: false,
      category: "player",
      argument: [{
        type: "bool",
        name: "detailed",
        description: "Trueが指定された場合、可能な場合より長く詳細を表示します",
        required: false,
      }],
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }
  
  async run(message: CommandMessage, context: CommandArgs){
    context.server.updateBoundChannel(message);
    // そもそも再生状態じゃないよ...
    if(!context.server.player.isPlaying){
      message.reply("再生中ではありません").catch(this.logger.error);
      return;
    }

    // create progress bar
    const _s = Math.floor(context.server.player.currentTime / 1000);
    const _t = Number(context.server.player.currentAudioInfo.lengthSeconds);
    const [min, sec] = Util.time.calcMinSec(_s);
    const [tmin, tsec] = Util.time.calcMinSec(_t);
    const info = context.server.player.currentAudioInfo;
    let progressBar = "";
    if(_t > 0){
      const progress = Math.floor(_s / _t * 20);
      progressBar += "=".repeat(progress - 1);
      progressBar += "●";
      progressBar += "=".repeat(20 - progress);
    }

    // create embed
    const embed = new MessageEmbedBuilder()
      .setColor(getColor("NP"))
      .setTitle("現在再生中の曲:musical_note:")
      .setDescription(
        `[${info.title}](${info.url})\r\n${progressBar}${
          info.isYouTube() && info.isLiveStream ? "(ライブストリーム)" : ` \`${min}:${sec}/${_t === 0 ? "(不明)" : `${tmin}:${tsec}\``}`
        }`
      )
      .setFields(
        ...info.toField(
          ["long", "l", "verbose", "l", "true"].some(arg => context.args[0] === arg)
        )
      )
      .addField(":link:URL", info.url);

    if(typeof info.thumbnail === "string"){
      embed.setThumbnail(info.thumbnail);
      await message.reply({ embeds: [embed.toOceanic()] }).catch(this.logger.error);
    }else{
      embed.setThumbnail("attachment://thumbnail." + info.thumbnail.ext);
      await message.reply({
        embeds: [embed.toOceanic()],
        files: [
          {
            name: "thumbnail." + info.thumbnail.ext,
            contents: info.thumbnail.data,
          },
        ],
      }).catch(this.logger.error);
    }
  }
}
