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
import * as Util from "../Util";
import { getColor } from "../Util/color";

export default class Searchq extends BaseCommand {
  constructor() {
    super({
      alias: ["searchqueue", "searchq", "seq", "sq"],
      unlist: false,
      category: "playlist",
      args: [{
        type: "string",
        name: "keyword",
        required: true,
      }],
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: true,
      examples: true,
      usage: true,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    if (context.server.queue.length === 0) {
      message.reply(t("commands:searchqueue.queueEmpty")).catch(this.logger.error);
      return;
    }

    // 検索を実行
    const qsresult = context.server.queue
      .filter(c =>
        c.basicInfo.title.toLowerCase().includes(context.rawArgs.toLowerCase())
        || c.basicInfo.url.toLowerCase().includes(context.rawArgs.toLowerCase())
        || c.basicInfo.description?.toLowerCase().includes(context.rawArgs.toLowerCase())
      )
    ;

    if (qsresult.length === 0) {
      message.reply(`:confused:${t("search.notFound")}`).catch(this.logger.error);
      return;
    }

    // 20件以上の検索結果をドロップ
    if (qsresult.length > 20) {
      qsresult.splice(20);
    }

    // 埋め込みを作成
    const fields = qsresult.map(c => {
      const index = context.server.queue.findIndex(d => d.basicInfo.title === c.basicInfo.title).toString();
      const _t = c.basicInfo.lengthSeconds;
      const [min, sec] = Util.time.calcMinSec(_t);
      return {
        name: index === "0"
          ? `${t("components:nowplaying.nowplayingItemName")}/${t("components:nowplaying.waitForPlayingItemName")}`
          : index,
        value: [
          c.basicInfo.isPrivateSource ? c.basicInfo.title : `[${c.basicInfo.title}](${c.basicInfo.url})`,
          `${t("components:nowplaying.requestedBy")}: \`${c.additionalInfo.addedBy.displayName}\` `,
          `${t("length")}: ${
            c.basicInfo.isYouTube() && c.basicInfo.isLiveStream
              ? `(${t("liveStream")})`
              : ` \`${_t === 0 ? `(${t("unknown")})` : `${min}:${sec}`}\`)`
          }`,
        ].join("\r\n"),
        inline: false,
      } as EmbedField;
    });
    const embed = new MessageEmbedBuilder()
      .setTitle(`${t("components:search.resultTitle", { query: context.rawArgs })}✨`)
      .setDescription(t("commands:searchqueue.embedDescription"))
      .setFields(...fields)
      .setColor(getColor("SEARCH"))
      .toOceanic()
    ;
    message.reply({ embeds: [embed] }).catch(this.logger.error);
  }
}
