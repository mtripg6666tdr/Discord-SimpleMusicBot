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

export default class Mltf extends BaseCommand {
  constructor(){
    super({
      alias: ["movelastsongtofirst", "mlstf", "ml", "mltf", "mlf", "m1", "pt"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: ["admin", "onlyListener", "dj"],
      shouldDefer: false,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs){
    const { t } = context;

    if(context.server.queue.length <= 2){
      message.reply(t("commands:movelastsongtofirst.usableWhen3orMoreQueue")).catch(this.logger.error);
      return;
    }
    const q = context.server.queue;
    const to = context.server.player.isPlaying ? 1 : 0;
    q.move(q.length - 1, to);
    const info = q.get(to);
    message.reply(`✅${t("commands:movelastsongtofirst.success", { title: info.basicInfo.title })}`).catch(this.logger.error);
  }
}
