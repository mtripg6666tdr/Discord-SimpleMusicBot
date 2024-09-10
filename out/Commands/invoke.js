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
const spawner_1 = require("../AudioSource/youtube/spawner");
const strategies_1 = require("../AudioSource/youtube/strategies");
const commandManager_1 = require("../Component/commandManager");
const CommandMessage_1 = require("../Component/commandResolver/CommandMessage");
const config_1 = require("../config");
const logger_1 = require("../logger");
class Invoke extends _1.BaseCommand {
    constructor() {
        super({
            alias: ["invoke"],
            unlist: false,
            category: "utility",
            args: [{
                    name: "command",
                    type: "string",
                    required: true,
                }],
            requiredPermissionsOr: [],
            shouldDefer: true,
            usage: true,
            examples: true,
        });
    }
    async run(message, context) {
        const { t } = context;
        // handle special commands
        if (context.rawArgs.startsWith("sp;") && (0, config_1.getConfig)().isBotAdmin(message.member.id)) {
            this.evaluateSpecialCommands(context.args[0].substring(3), message, context)
                .then(result => message.reply(result))
                .catch(this.logger.error);
            return;
        }
        // extract a requested normal command
        const commandInfo = CommandMessage_1.CommandMessage.resolveCommandMessage(context.rawArgs, 0);
        if (commandInfo.command === "invoke") {
            await message.reply(t("commands:invoke.recursiveInvoke")).catch(this.logger.error);
            return;
        }
        // run the command
        const ci = commandManager_1.CommandManager.instance.resolve(commandInfo.command);
        if (ci) {
            context.args = commandInfo.options;
            context.rawArgs = commandInfo.rawOptions;
            await ci.checkAndRun(message, context).catch(this.logger.error);
            if (!message["isMessage"] && !message["_interactionReplied"]) {
                await message.reply(t("commands:invoke.executed")).catch(this.logger.error);
            }
        }
        else {
            await message.reply(t("commands:invoke.commandNotFound")).catch(this.logger.error);
        }
    }
    async evaluateSpecialCommands(specialCommand, message, context) {
        switch (specialCommand) {
            case "cleanupsc":
                await commandManager_1.CommandManager.instance.sync(context.client, true);
                break;
            case "removesca":
                await commandManager_1.CommandManager.instance.removeAllApplicationCommand(context.client);
                break;
            case "removescg":
                await commandManager_1.CommandManager.instance.removeAllGuildCommand(context.client, message.guild.id);
                break;
            case "purgememcache":
                context.bot.cache.purgeMemoryCache();
                break;
            case "purgediskcache":
                await context.bot.cache.purgePersistentCache();
                break;
            case "obtainsyslog":
                message.reply({
                    files: [
                        {
                            contents: Buffer.from((0, logger_1.getLogs)().join("\r\n")),
                            name: "log.txt",
                        },
                    ],
                }).catch(this.logger.error);
                break;
            case "updatestrcfg":
                {
                    const config = context.args[1];
                    (0, spawner_1.updateStrategyConfiguration)(config);
                    (0, strategies_1.updateStrategyConfiguration)(config);
                }
                break;
            default:
                return context.t("commands:invoke.specialCommandNotFound");
        }
        return context.t("commands:invoke.executed");
    }
}
exports.default = Invoke;
//# sourceMappingURL=invoke.js.map