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

import { Routes } from "oceanic.js";

import { BaseCommand } from ".";
import { GuildDataContainerWithBgm } from "../Structure/GuildDataContainerWithBgm";

export default class Reset extends BaseCommand {
  constructor(){
    super({
      alias: ["reset"],
      unlist: false,
      category: "utility",
      requiredPermissionsOr: ["manageGuild"],
      shouldDefer: false,
      args: [
        {
          type: "bool" as const,
          name: "preservequeue",
          required: false,
        },
      ],
    });
  }

  async run(message: CommandMessage, context: CommandArgs){
    const { t } = context;
    // VC接続中なら切断
    await context.server.player.disconnect().catch(this.logger.error);

    const queueItems = context.args[0]?.toLowerCase() === "true" ? context.server.queue.getRawQueueItems() : null;

    // データホルダーからデータを削除
    context.server.bot.resetData(message.guild.id);

    // レートリミットの制限をすべて解除
    const bucket = context.client.rest.handler.ratelimits[Routes.CHANNEL_MESSAGES(context.server.boundTextChannel)];
    if(bucket){
      // キューをすべて消すためのトリック
      let allPurged = false;
      bucket.queue(cb => {
        allPurged = true;
        cb();
      });
      do{
        bucket["check"](/* force */ true);
      // eslint-disable-next-line no-unmodified-loop-condition
      } while(!allPurged);
    }

    // データあたらしく初期化
    const newServer = context.initData(message.guild.id, message.channel.id);

    // BGMキューの初期化
    if(newServer instanceof GuildDataContainerWithBgm){
      await newServer.initBgmTracks();
    }

    // キューの復元を試みる
    if(queueItems){
      newServer.queue.addRawQueueItems(queueItems);
    }

    message.reply(`✅${t("commands:reset.success")}`).catch(this.logger.error);
  }
}
