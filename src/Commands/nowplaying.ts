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
import type { i18n } from "i18next";

import { MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import * as Util from "../Util";
import { getColor } from "../Util/color";

export default class NowPlaying extends BaseCommand {
  constructor(){
    super({
      alias: ["今の曲", "nowplaying", "np"],
      unlist: false,
      category: "player",
      argument: [{
        type: "bool" as const,
        name: "detailed",
        required: false,
      }],
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }
  
  async run(message: CommandMessage, context: CommandArgs, t: i18n["t"]){
    context.server.updateBoundChannel(message);
    // そもそも再生状態じゃないよ...
    if(!context.server.player.isPlaying){
      message.reply(t("notPlaying")).catch(this.logger.error);
      return;
    }

    // create progress bar
    const currentTimeSeconds = Math.floor(context.server.player.currentTime / 1000);
    const totalDurationSeconds = Number(context.server.player.currentAudioInfo!.lengthSeconds * (
      context.server.audioEffects.getEnabled("nightcore") ? 5 / 6 : 1
    ));
    const [min, sec] = Util.time.calcMinSec(currentTimeSeconds);
    const [tmin, tsec] = Util.time.calcMinSec(totalDurationSeconds);
    const info = context.server.player.currentAudioInfo!;
    let progressBar = "";
    if(totalDurationSeconds > 0){
      const progress = Math.floor(currentTimeSeconds / totalDurationSeconds * 20);
      progressBar += "=".repeat(progress > 0 ? progress - 1 : 0);
      progressBar += "●";
      progressBar += "=".repeat(20 - progress);
    }

    // create embed
    const embed = new MessageEmbedBuilder()
      .setColor(getColor("NP"))
      .setTitle(`${t("commands:nowplaying.nowPlayingSong")}:musical_note:`)
      .setDescription(
        (
          info.isPrivateSource
            ? info.title
            : `[${info.title}](${info.url})`
        )
        + `\r\n${progressBar}${
          info.isYouTube() && info.isLiveStream
            ? `(${t("liveStream")})`
            : ` \`${min}:${sec}/${totalDurationSeconds === 0 ? `(${t("unknown")})` : `${tmin}:${tsec}\``}`
        }`
      )
      .setFields(
        ...info.toField(
          ["long", "l", "verbose", "l", "true"].some(arg => context.args[0] === arg),
          t
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
