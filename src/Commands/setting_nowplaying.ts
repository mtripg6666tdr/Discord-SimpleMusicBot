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
import { NowPlayingNotificationLevel } from "../types/GuildPreferences";

export default class SettingNowPlayingNotification extends BaseCommand {
  constructor() {
    super({
      alias: ["setting>nowplaying"],
      unlist: false,
      category: "settings",
      requiredPermissionsOr: ["admin", "dj", "onlyListener", "manageGuild"],
      shouldDefer: false,
      examples: false,
      usage: false,
      args: [
        {
          type: "string",
          name: "level",
          required: false,
          choices: [
            "normal",
            "silent",
            "disabled",
          ],
        },
      ],
    });
  }

  async run(message: CommandMessage, context: CommandArgs) {
    if (context.rawArgs) {
      const level = this.resolveLevel(context.rawArgs);

      if (level === null) {
        await message.reply(context.t("commands:setting>nowplaying.invalidLevel"));
        return;
      }

      context.server.preferences.nowPlayingNotificationLevel = level;

      await message.reply(context.t("commands:setting>nowplaying.changed", {
        level: context.t(`commands:setting>nowplaying.args.level.choices.${this.levelToString(level)}`),
      }));
    } else {
      await message.reply(context.t("commands:setting>nowplaying.currentState", {
        level: context.t(`commands:setting>nowplaying.args.level.choices.${this.levelToString(context.server.preferences.nowPlayingNotificationLevel)}`),
      }));
    }
  }

  resolveLevel(level: string): NowPlayingNotificationLevel | null {
    switch (level.toLowerCase()) {
      case "normal":
      case "true":
        return NowPlayingNotificationLevel.Normal;
      case "silent":
        return NowPlayingNotificationLevel.Silent;
      case "disabled":
      case "false":
        return NowPlayingNotificationLevel.Disable;
      default:
        return null;
    }
  }

  levelToString(level: NowPlayingNotificationLevel) {
    switch (level) {
      case NowPlayingNotificationLevel.Normal:
        return "normal" as const;
      case NowPlayingNotificationLevel.Silent:
        return "silent" as const;
      case NowPlayingNotificationLevel.Disable:
        return "disabled" as const;
    }
  }
}
