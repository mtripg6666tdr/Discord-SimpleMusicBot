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

export default class Dc extends BaseCommand {
  constructor() {
    super({
      unlist: false,
      alias: ["終了", "disconnect", "dc", "leave", "quit"] as const,
      category: "voice",
      requiredPermissionsOr: ["admin", "sameVc", "onlyBotInVc"],
      shouldDefer: false,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    // そもそも再生状態じゃないよ...
    if (!context.server.player.isConnecting) {
      message.reply(t("notPlaying")).catch(this.logger.error);
      return;
    }
    // 停止しま～す
    await context.server.player.disconnect().catch(this.logger.error);
    message.reply(`:postbox:${t("disconnected")}`).catch(this.logger.error);
  }
}
