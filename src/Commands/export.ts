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
import { YmxVersion } from "../Structure";

export default class Export extends BaseCommand {
  constructor() {
    super({
      alias: ["export"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    if (context.server.queue.publicLength === 0) {
      message.reply(t("commands:export.queueEmpty")).catch(this.logger.error);
      return;
    }
    const ymxFile = context.server.exportQueue();
    const msg = await message.reply({
      content: `✅${t("commands:export.exported")}`,
      files: [{
        contents: Buffer.from(JSON.stringify(ymxFile)),
        name: "exported_queue.ymx",
      }],
    });
    await msg
      .edit(`✅${
        t("commands:export.exported")
      } (${
        t("commands:export.compatiblity", { version: YmxVersion })
      })\r\n${t("commands:export.importInstruction", { url: msg.url })}`)
      .catch(this.logger.error)
    ;
  }
}
