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

import { BaseCommand } from ".";
import { updateStrategyConfiguration as updateStrategyConfigInWorker } from "../AudioSource/youtube/spawner";
import { updateStrategyConfiguration } from "../AudioSource/youtube/strategies";
import { CommandManager } from "../Component/commandManager";
import { CommandMessage } from "../Component/commandResolver/CommandMessage";
import { getConfig } from "../config";
import { getLogs } from "../logger";

export default class Invoke extends BaseCommand {
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

  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    // handle special commands
    if (context.rawArgs.startsWith("sp;") && getConfig().isBotAdmin(message.member.id)) {
      this.evaluateSpecialCommands(context.args[0].substring(3), message, context)
        .then(result => message.reply(result))
        .catch(this.logger.error)
      ;
      return;
    }

    // extract a requested normal command
    const commandInfo = CommandMessage.resolveCommandMessage(context.rawArgs, 0);
    if (commandInfo.command === "invoke") {
      await message.reply(t("commands:invoke.recursiveInvoke")).catch(this.logger.error);
      return;
    }

    // run the command
    const ci = CommandManager.instance.resolve(commandInfo.command);
    if (ci) {
      context.args = commandInfo.options;
      context.rawArgs = commandInfo.rawOptions;
      await ci.checkAndRun(message, context).catch(this.logger.error);
      if (!message["isMessage"] && !message["_interactionReplied"]) {
        await message.reply(t("commands:invoke.executed")).catch(this.logger.error);
      }
    } else {
      await message.reply(t("commands:invoke.commandNotFound")).catch(this.logger.error);
    }
  }

  private async evaluateSpecialCommands(specialCommand: string, message: CommandMessage, context: CommandArgs) {
    switch (specialCommand) {
      case "cleanupsc":
        await CommandManager.instance.sync(context.client, true);
        break;
      case "removesca":
        await CommandManager.instance.removeAllApplicationCommand(context.client);
        break;
      case "removescg":
        await CommandManager.instance.removeAllGuildCommand(context.client, message.guild.id);
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
              contents: Buffer.from(getLogs().join("\r\n")),
              name: "log.txt",
            },
          ],
        }).catch(this.logger.error);
        break;
      case "updatestrcfg": {
        const config = context.args[1];
        updateStrategyConfigInWorker(config);
        updateStrategyConfiguration(config);
      }
        break;
      default:
        return context.t("commands:invoke.specialCommandNotFound");
    }
    return context.t("commands:invoke.executed");
  }
}
