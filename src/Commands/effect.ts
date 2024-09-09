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
import type { MessageActionRow } from "oceanic.js";

import { MessageActionRowBuilder, MessageButtonBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import { audioEffectNames, type AudioEffectNames } from "../Component/audioEffectManager";

export default class Effect extends BaseCommand {
  constructor() {
    super({
      alias: ["effect", "音声エフェクト", "音声効果", "効果"],
      unlist: false,
      category: "player",
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    try {
      const { collector, customIdMap } = context.server.bot.collectors.create()
        .setAuthorIdFilter(message.member.id)
        .setMaxInteraction(Infinity)
        .setTimeout(5 * 60 * 1000)
        .createCustomIds(
          Object.fromEntries(
            [
              ["reload", "button"],
              ...audioEffectNames.map(name => [name, "button" as const]),
            ]
          ) as Record<"reload" | AudioEffectNames, "button">
        );
      const createActionRow = () => {
        const rows: MessageActionRow[] = [];
        const components = [
          new MessageButtonBuilder()
            .setCustomId(customIdMap.reload)
            .setStyle("PRIMARY")
            .setEmoji("🔁")
            .setLabel(t("commands:effect.effectControllPanel.reload")),
          ...context.server.audioEffects.createMessageButtons(customIdMap),
        ];
        for (let i = 0; i < Math.ceil(components.length / 5); i++) {
          rows.push(
            new MessageActionRowBuilder()
              .addComponents(...components.slice(i * 5, (i + 1) * 5))
              .toOceanic()
          );
        }

        return rows;
      };

      const reply = await message.reply({
        embeds: [context.server.audioEffects.createEmbed(message.member.avatarURL())],
        components: createActionRow(),
      });
      const updateEffectEmbed = (emptyrow = false) => {
        reply.edit({
          embeds: [context.server.audioEffects.createEmbed(message.member.avatarURL())],
          components: emptyrow ? [] : createActionRow(),
        }).catch(this.logger.error);
      };
      collector.on("reload", () => updateEffectEmbed());
      collector.on("timeout", () => updateEffectEmbed(true));

      for (const effectName of audioEffectNames) {
        collector.on(effectName, () => {
          context.server.audioEffects.toggle(effectName);
          updateEffectEmbed();
        });
      }
    }
    catch (e) {
      this.logger.error(e);
      message.reply(`:cry:${t("errorOccurred")}`).catch(this.logger.error);
    }
  }
}
