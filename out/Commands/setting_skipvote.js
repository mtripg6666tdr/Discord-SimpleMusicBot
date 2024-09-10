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
class SettingSkipvote extends _1.BaseCommand {
    constructor() {
        super({
            alias: ["setting>skipvote"],
            unlist: false,
            category: "settings",
            requiredPermissionsOr: ["admin", "dj", "manageGuild"],
            shouldDefer: false,
            examples: false,
            usage: false,
            args: [
                {
                    type: "bool",
                    name: "enabled",
                    required: false,
                },
            ],
        });
    }
    async run(message, context) {
        if (context.rawArgs) {
            const newDisabledStatus = context.server.preferences.disableSkipSession = !(context.args[0] === "enable" || context.args[0] === "true");
            await message.reply(context.t("commands:setting>skipvote.changed", {
                status: newDisabledStatus ? context.t("disabled") : context.t("enabled"),
            }));
        }
        else {
            await message.reply(context.t("commands:setting>skipvote.currentState", {
                status: context.server.preferences.disableSkipSession ? context.t("disabled") : context.t("enabled"),
            }));
        }
    }
}
exports.default = SettingSkipvote;
//# sourceMappingURL=setting_skipvote.js.map