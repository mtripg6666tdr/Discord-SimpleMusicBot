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

import type { GuildDataContainer } from "../Structure";
import type { MusicBot } from "../bot";
import type * as discord from "oceanic.js";

import { CommandManager } from "../Component/commandManager";

export async function handleModalSubmitInteraction(
  this: MusicBot,
  server: GuildDataContainer,
  interaction: discord.ModalSubmitInteraction,
) {
  if (!interaction.inCachedGuildChannel()) return;
  this.logger.info("received modalsubmit interaction");

  const targetCommand = CommandManager.instance.resolve(interaction.data.customID);

  await targetCommand?.handleModalSubmitInteraction(interaction, server);
}
