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

import { BaseCommand, CommandArgs } from ".";
import { CommandMessage } from "../Component/commandResolver/CommandMessage";
import { colonSplittedTimeToSeconds } from "../Util/time";

export default class SleepTimer extends BaseCommand {
  constructor() {
    super({
      alias: ["sleeptimer", "sleep", "timer"],
      unlist: false,
      category: "player",
      args: [{
        type: "string",
        name: "time",
        required: false,
      }],
      requiredPermissionsOr: ["admin", "dj", "onlyListener"],
      shouldDefer: false,
      examples: true,
      usage: true,
    });
  }

  async run(message: CommandMessage, context: CommandArgs) {
    const { t, server } = context;

    // そもそも接続中ではない場合
    if (!server.player.isConnecting) {
      await message.reply(t("notPlaying")).catch(this.logger.error);
      return;
    }

    if (context.rawArgs === "") {
      server.player.setSleepTimer(false);
      await message.reply(t("commands:sleeptimer.canceled")).catch(this.logger.error);
      return;
    }

    const toCurrentSong = context.rawArgs === "$";

    if (toCurrentSong) {
      server.player.setSleepTimer(true);
      await message.reply(t("commands:sleeptimer.doneCurrentSong")).catch(this.logger.error);
      return;
    }

    const time = colonSplittedTimeToSeconds(context.rawArgs);

    if (isNaN(time)) {
      await message.reply(t("commands:sleeptimer.invalidTime")).catch(this.logger.error);
      return;
    }

    server.player.setSleepTimer(time);
    await message.reply(t("commands:sleeptimer.done", {
      time: context.rawArgs,
    })).catch(this.logger.error);
  }
}
