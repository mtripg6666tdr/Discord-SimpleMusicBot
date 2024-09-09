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

export default class Rewind extends BaseCommand {
  constructor() {
    super({
      alias: ["rewind", "gotop", "replay"],
      unlist: false,
      category: "player",
      requiredPermissionsOr: ["admin", "sameVc"],
      shouldDefer: false,
    });
  }
  
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;
    context.server.updateBoundChannel(message);
    if (!context.server.player.isPlaying) {
      message.reply(t("notPlaying")).catch(this.logger.error);
    } else {
      await message.reply({
        content: `${context.includeMention ? `<@${message.member.id}> ` : ""}:rewind:${t("commands:rewind.success")}:+1:`,
        allowedMentions: {
          users: false,
        },
      }).catch(this.logger.error);
      context.server.player.rewind().catch(this.logger.error);
    }
  }
}
