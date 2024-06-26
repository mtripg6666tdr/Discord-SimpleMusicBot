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

export default class BgmBd extends BaseCommand {
  constructor(){
    super({
      name: "BGMBD",
      alias: ["bgmbd"],
      unlist: true,
      shouldDefer: false,
      disabled: !process.env.BD_ENABLE,
    });
  }

  @BaseCommand.updateBoundChannel
  protected async run(message: CommandMessage, context: Readonly<CommandArgs>): Promise<void> {
    await context.server.joinVoiceChannel(message, { replyOnFail: true });
    const bgmPlaylistUrl = context.rawArgs.length === 0
      ? "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTExmZmhjQXBzbzl4UFhLUG5YbEZ3czlxWUNkMDltTFA0"
      : "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTExmZmhjQXBzbzl4WnpYZ0RFdEdsQk5wNUtYZjNPY1Zx";
    await context.server.playFromUrl(message, Buffer.from(bgmPlaylistUrl, "base64").toString(), {});
  }
}
