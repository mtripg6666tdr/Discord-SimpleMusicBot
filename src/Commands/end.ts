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

export default class End extends BaseCommand {
  constructor() {
    super({
      alias: ["end"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: ["admin", "dj", "onlyListener"],
      shouldDefer: false,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    if (!context.server.player.isPlaying) {
      message.reply(t("notPlaying")).catch(this.logger.error);
      return;
    }
    if (context.server.queue.length <= 1) {
      message.reply(t("commands:end.queueWasEmpty")).catch(this.logger.error);
      return;
    }
    context.server.queue.removeFrom2nd();
    context.server.queue.queueLoopEnabled = context.server.queue.onceLoopEnabled = context.server.queue.loopEnabled = false;
    message.reply(`✅${t("commands:end.success")}`).catch(this.logger.error);
  }
}
