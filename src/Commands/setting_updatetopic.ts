/*
 * Copyright 2021-2025 mtripg6666tdr
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

export default class SettingUpdateTopic extends BaseCommand {
  constructor() {
    super({
      alias: ["setting>updatetopic"],
      unlist: false,
      category: "settings",
      requiredPermissionsOr: ["admin", "manageGuild"],
      shouldDefer: false,
      examples: false,
      usage: true,
      args: [
        {
          type: "bool",
          name: "enabled",
          required: false,
        },
      ],
    });
  }

  async run(message: CommandMessage, context: CommandArgs) {
    if (context.rawArgs) {
      const currentStatus = context.server.preferences.updateChannelTopic = context.args[0] === "enable" || context.args[0] === "true";

      await message.reply(context.t("commands:setting>updatetopic.changed", {
        status: currentStatus ? context.t("enabled") : context.t("disabled"),
      }));
    } else {
      await message.reply(context.t("commands:setting>updatetopic.currentState", {
        status: context.server.preferences.updateChannelTopic ? context.t("enabled") : context.t("disabled"),
      }));
    }
  }
}
