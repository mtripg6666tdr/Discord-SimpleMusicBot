"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const GuildPreferences_1 = require("../types/GuildPreferences");
class SettingNowPlayingNotification extends _1.BaseCommand {
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
    async run(message, context) {
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
        }
        else {
            await message.reply(context.t("commands:setting>nowplaying.currentState", {
                level: context.t(`commands:setting>nowplaying.args.level.choices.${this.levelToString(context.server.preferences.nowPlayingNotificationLevel)}`),
            }));
        }
    }
    resolveLevel(level) {
        switch (level.toLowerCase()) {
            case "normal":
            case "true":
                return GuildPreferences_1.NowPlayingNotificationLevel.Normal;
            case "silent":
                return GuildPreferences_1.NowPlayingNotificationLevel.Silent;
            case "disabled":
            case "false":
                return GuildPreferences_1.NowPlayingNotificationLevel.Disable;
            default:
                return null;
        }
    }
    levelToString(level) {
        switch (level) {
            case GuildPreferences_1.NowPlayingNotificationLevel.Normal:
                return "normal";
            case GuildPreferences_1.NowPlayingNotificationLevel.Silent:
                return "silent";
            case GuildPreferences_1.NowPlayingNotificationLevel.Disable:
                return "disabled";
        }
    }
}
exports.default = SettingNowPlayingNotification;
//# sourceMappingURL=setting_nowplaying.js.map