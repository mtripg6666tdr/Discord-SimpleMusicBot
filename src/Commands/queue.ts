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

import { MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import * as Util from "../Util";
import { getColor } from "../Util/color";

export default class Queue extends BaseCommand {
  constructor() {
    super({
      alias: ["キューを表示", "再生待ち", "queue", "q"],
      unlist: false,
      category: "playlist",
      args: [{
        type: "integer" as const,
        name: "page",
        required: false,
      }],
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;
    const queue = context.server.queue;
    if (queue.length === 0) {
      await message.reply(`:face_with_raised_eyebrow:${t("commands:queue.queueEmpty")}`).catch(this.logger.error);
      return;
    }
    // 合計所要時間の計算
    const totalLength = queue.lengthSecondsActual;
    let _page = context.rawArgs === "" ? 0 : Number(context.rawArgs);
    if (isNaN(_page)) _page = 1;
    if (queue.length > 0 && _page > Math.ceil(queue.length / 10)) {
      await message.reply(`:warning:${t("commands:queue.pageOutOfRange")}`).catch(this.logger.error);
      return;
    }
    // 合計ページ数割り出し
    const totalpage = Math.ceil(queue.length / 10);

    // ページのキューを割り出す
    const getQueueEmbed = (page: number) => {
      const fields: { name: string, value: string }[] = [];
      for (let i = 10 * page; i < 10 * (page + 1); i++) {
        if (queue.length <= i) {
          break;
        }
        const q = queue.get(i);
        const _t = Number(q.basicInfo.lengthSeconds);
        const [min, sec] = Util.time.calcMinSec(_t);
        fields.push({
          name: i !== 0
            ? i.toString()
            : context.server.player.isPlaying
              ? t("components:nowplaying.nowplayingItemName")
              : t("components:nowplaying.waitForPlayingItemName"),
          value: [
            q.basicInfo.isPrivateSource ? q.basicInfo.title : `[${q.basicInfo.title}](${q.basicInfo.url})`,
            `${t("length")}: \`${
              q.basicInfo.isYouTube() && q.basicInfo.isLiveStream
                ? t("commands:log.liveStream")
                : `${min}:${sec}`
            } \``,
            `${t("components:nowplaying.requestedBy")}: \`${q.additionalInfo.addedBy.displayName}\` `,
            q.basicInfo.npAdditional(),
          ].join("\r\n"),
        });
      }
      const [thour, tmin, tsec] = Util.time.calcHourMinSec(totalLength);
      return new MessageEmbedBuilder()
        .setTitle(t("components:queue.queueTitle", { server: message.guild.name }))
        .setDescription(`\`${t("currentPage", { count: page + 1 })}(${t("allPages", { count: totalpage })})\``)
        .addFields(...fields)
        .setAuthor({
          name: context.client.user.username,
          iconURL: context.client.user.avatarURL(),
        })
        .setFooter({
          text: [
            `${t("commands:queue.songCount", { count: queue.length })}`,
            `${t("commands:queue.total")}: ${thour}:${tmin}:${tsec}`,
            `${t("components:queue.trackloop")}:${queue.loopEnabled ? "⭕" : "❌"}`,
            `${t("components:queue.queueloop")}:${queue.queueLoopEnabled ? "⭕" : "❌"}`,
            `${t("components:queue.autoplayRelated")}:${context.server.preferences.addRelated ? "⭕" : "❌"}`,
            `${t("components:queue.equallyplayback")}:${context.server.preferences.equallyPlayback ? "⭕" : "❌"}`,
          ].join(" | "),
        })
        .setThumbnail(message.guild.iconURL()!)
        .setColor(getColor("QUEUE"))
        .toOceanic()
      ;
    };

    // 送信
    if (totalpage > 1) {
      const pagenation = await context.bot.collectors
        .createPagenation()
        .setPages(getQueueEmbed, totalpage)
        .send(message);
      context.server.queue.eitherOnce(["change", "changeWithoutCurrent"], pagenation.destroy.bind(pagenation));
    } else {
      await message.reply({ content: "", embeds: [getQueueEmbed(_page)] }).catch(this.logger.error);
    }
  }
}
