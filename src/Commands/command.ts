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
import type { EmbedField } from "oceanic.js";

import { MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import { CommandManager } from "../Component/commandManager";
import { getColor } from "../Util/color";
import { getConfig } from "../config";

const config = getConfig();

export const categoriesList = ["voice", "player", "playlist", "utility", "bot", "settings"] as const;

export default class Commands extends BaseCommand {
  constructor() {
    super({
      unlist: false,
      alias: ["command", "commands", "cmd"],
      category: "bot",
      args: [
        {
          type: "string",
          name: "command",
          required: false,
          autoCompleteEnabled: true,
        },
      ],
      requiredPermissionsOr: [],
      shouldDefer: false,
      usage: true,
      examples: true,
    });
  }

  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    if (context.rawArgs === "") {
      // 引数がない場合は全コマンドの一覧を表示
      const embed = [] as MessageEmbedBuilder[];
      const getCategoryText = (label: typeof categoriesList[number])=>{
        return t(`commands:command.categories.${label}`);
      };
      const rawcommands = CommandManager.instance.commands.filter(ci => !ci.unlist);
      const commands = {} as { [category: string]: BaseCommand[] };

      // Generate command list
      for (let i = 0; i < rawcommands.length; i++) {
        if (commands[rawcommands[i].category]) {
          commands[rawcommands[i].category].push(rawcommands[i]);
        } else {
          commands[rawcommands[i].category] = [rawcommands[i]];
        }
      }

      // Generate embed
      for (let i = 0; i < categoriesList.length; i++) {
        embed.push(
          new MessageEmbedBuilder()
            .setTitle(getCategoryText(categoriesList[i]))
            .addFields(
              ...commands[categoriesList[i]].map(ci => ({
                name: [...new Set([ci.name, ...ci.alias])].join(", "),
                value: ci.getLocalizedDescription(context.locale),
                inline: true,
              } as EmbedField))
            )
        );
      }
      for (let i = 0; i < embed.length; i++) {
        embed[i]
          .setTitle(`${t("commands:command.commandList")}(${embed[i].title})`)
          .setDescription(
            `\`${
              t("currentPage", { count: i + 1 })
            }(${
              t("allPages", { count: embed.length })
            })\`\r\n`
            + (
              config.noMessageContent
                ? t("commands:command.toLearnMoreInteraction")
                : `${t("prefixIs", { prefix: context.server.prefix })}\r\n${t("commands:command.toLearnMoreMessage", { prefix: context.server.prefix })}`
            )
          )
          .setColor(getColor("COMMAND"));
      }

      await context.bot.collectors
        .createPagenation()
        .setPages(embed, embed.length)
        .send(message);
    } else {
      const ci = CommandManager.instance.resolve(context.rawArgs);
      if (ci && !ci.unlist) {
        const prefix = context.server ? context.server.prefix : ">";
        const availableAlias = ci.alias.filter(a => a !== ci.name);
        const embed = new MessageEmbedBuilder()
          .setTitle(t("commands:command.commandExplanation", { command: ci.name }))
          .setDescription(ci.getLocalizedDescription(context.locale))
          .setColor(getColor("COMMAND"))
          .addField(
            t("alias"),
            availableAlias.length > 0
              ? `\`${availableAlias.join("`, `")}\``
              : `*${t("none")}*`
          )
          .addField(t("permissionsToRun"), ci.getLocalizedPermissionDescription(context.locale))
        ;
        if (ci.usage) {
          embed.addField(
            t("commands:command.usageLabel"),
            `\`${prefix}${t(`commands:${ci.asciiName}.usage` as any, { lng: context.locale })}\` \r\n`
            + t("commands:command.argumentDescription")
          );
        }
        if (ci.examples) {
          embed.addField(
            t("commands:command.exampleLabel"),
            `\`${prefix}${t(`commands:${ci.asciiName}.examples` as any, { lng: context.locale })}\``
          );
        }
        await message.reply({ embeds: [embed.toOceanic()] });
      } else {
        await message.reply(`:face_with_raised_eyebrow:${t("commands:command.commandNotFound")}`);
      }
    }
  }

  override handleAutoComplete(_: string, input: string): string[] {
    if (input === "") {
      return [
        "play",
        "search",
        "queue",
        "nowplaying",
        "pause",
        "disconnect",
      ];
    } else {
      return [...new Set(
        CommandManager.instance.commands
          .filter(command => !command.unlist)
          .flatMap(command => [command.name, ...command.alias])
          .filter(name => name.includes(input))
      )];
    }
  }
}
