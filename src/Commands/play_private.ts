/*
 * Copyright 2021-2023 mtripg6666tdr
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
import type { GuildDataContainer } from "../Structure";
import type { i18n } from "i18next";
import type { AnyTextableGuildChannel, ModalSubmitInteraction } from "oceanic.js";

import i18next from "i18next";
import { ComponentTypes, InteractionTypes, TextInputStyles } from "oceanic.js";

import { BaseCommand } from ".";
import { CommandMessage } from "../Component/commandResolver/CommandMessage";

export default class PlayPrivate extends BaseCommand {
  constructor(){
    super({
      unlist: false,
      alias: ["play_private"],
      category: "player",
      requiredPermissionsOr: [],
      shouldDefer: false,
      interactionOnly: true,
      defaultMemberPermission: [],
    });
  }

  protected override async run(message: CommandMessage, context: Readonly<CommandArgs>, t: i18n["t"]){
    if(message["isMessage"] || !message["_interaction"]){
      await message.reply(`:x: ${t("commands:play_private.noInteraction")}`).catch(this.logger.error);
      return;
    }

    const interaction = message["_interaction"];
    if(interaction.type !== InteractionTypes.APPLICATION_COMMAND) return;
    await interaction.createModal({
      title: t("commands:play_private.modalTitle"),
      customID: "play_private",
      components: [
        {
          type: ComponentTypes.ACTION_ROW,
          components: [
            {
              type: ComponentTypes.TEXT_INPUT,
              label: t("commands:play_private.inputLabel"),
              required: true,
              placeholder: "https://",
              style: TextInputStyles.SHORT,
              customID: "url",
            },
          ],
        },
      ],
    }).catch(this.logger.error);
  }

  override async handleModalSubmitInteraction(interaction: ModalSubmitInteraction<AnyTextableGuildChannel>, server: GuildDataContainer){
    const value = interaction.data.components.getTextInput("url");

    if(value){
      const message = CommandMessage.createFromInteraction(interaction, "play_private", [value], value);
      // ここの型注釈を外すとTSサーバーがとんでもなく重くなる
      const fixedT: i18n["t"] = i18next.getFixedT(interaction.locale);

      const items = await server.playFromURL(
        message,
        value,
        { privateSource: true, first: false },
        fixedT,
      );

      if(items.length <= 0 || !await server.joinVoiceChannel(message, {}, fixedT)){
        return;
      }

      await server.player.play({ bgm: false });
    }
  }
}
