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
import type { CommandMessage } from "../Component/CommandMessage";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class Uptime extends BaseCommand {
  constructor() {
    super({
      name: "アップタイム",
      alias: ["ピング", "uptime", "ping"],
      description:
        "ボットのアップタイムおよびping時間(レイテンシ)を表示します。",
      unlist: false,
      category: "utility",
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, options: CommandArgs) {
    const now = Date.now();
    const insta = Util.time.CalcTime(
      now - options.bot.instantiatedTime.getTime(),
    );
    const ready = Util.time.CalcTime(options.client.uptime);
    const embed = new Helper.MessageEmbedBuilder()
      .setColor(getColor("UPTIME"))
      .setTitle(options.client.user.username + "のアップタイム")
      .addField(
        "インスタンス作成からの経過時間",
        `${insta[0]}時間${insta[1]}分${insta[2]}秒`,
      )
      .addField(
        "Discordに接続してからの経過時間",
        `${ready[0]}時間${ready[1]}分${ready[2]}秒`,
      )
      .addField(
        "レイテンシ",
        `${now - message.createdTimestamp}ミリ秒(ボット接続実測値)\r\n` +
          `${
            message.guild.shard.latency === Infinity
              ? "-"
              : message.guild.shard.latency
          }ミリ秒(ボットWebSocket接続取得値)\r\n` +
          `${
            (options.server.player.isConnecting && options.server.vcPing) || "-"
          }ミリ秒(ボイスチャンネルUDP接続取得値)`,
      )
      .addField(
        "データが保持されているサーバー数",
        `${options.bot.databaseCount}サーバー`,
      )
      .toEris();
    message.reply({embeds: [embed]}).catch(e => Util.logger.log(e, "error"));
  }
}
