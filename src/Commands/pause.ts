/*
 * Copyright 2021-2024 mtripg6666tdr
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

export default class Pause extends BaseCommand {
  constructor(){
    super({
      alias: ["一旦停止", "停止", "pause", "stop"],
      unlist: false,
      category: "player",
      requiredPermissionsOr: ["admin", "sameVc"],
      shouldDefer: false,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs){
    const { t } = context;

    // そもそも再生状態じゃないよ...
    if(!context.server.player.isPlaying){
      await message.reply(t("notPlaying")).catch(this.logger.error);
      return;
    }
    if(context.server.player.isPaused){
      await message.reply(
        `:pause_button: ${t("commands:pause.alreadyPaused")}\r\n`
        + t("commands:pause.usePlayToResume")).catch(this.logger.error);
      return;
    }

    // 停止
    context.server.player.pause();
    message.reply({
      content: `${context.includeMention ? `<@${message.member.id}> ` : ""}:pause_button:${t("commands:pause.paused")}`,
      allowedMentions: {
        users: false,
      },
    }).catch(this.logger.error);
  }
}
