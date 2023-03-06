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
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class OnceLoop extends BaseCommand {
  constructor() {
    super({
      name: "ワンスループ",
      alias: ["onceloop", "looponce"],
      description: "現在再生中の再生が終了後、もう一度だけ同じ曲をループ再生します。",
      unlist: false,
      category: "player",
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, options: CommandArgs) {
    options.server.updateBoundChannel(message);
    if(options.server.queue.onceLoopEnabled) {
      options.server.queue.onceLoopEnabled = false;
      message
        .reply({
          content: `${
            options.includeMention ? `<@${message.member.id}> ` : ""
          }:repeat_one:ワンスループを無効にしました:x:`,
          allowedMentions: {
            users: false,
          },
        })
        .catch(e => Util.logger.log(e, "error"));
    }else{
      options.server.queue.onceLoopEnabled = true;
      message
        .reply({
          content: `${
            options.includeMention ? `<@${message.member.id}> ` : ""
          }:repeat_one:ワンスループを有効にしました:o:`,
          allowedMentions: {
            users: false,
          },
        })
        .catch(e => Util.logger.log(e, "error"));
    }
  }
}
