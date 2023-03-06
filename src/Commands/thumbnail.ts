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

export default class Thumbnail extends BaseCommand {
  constructor() {
    super({
      name: "サムネイル",
      alias: ["サムネ", "thumbnail", "thumb", "t"],
      description:
        "現在再生中のサムネイルを表示します。検索パネルが開いていて検索パネル中の番号が指定された場合にはその曲のサムネイルを表示します。",
      unlist: false,
      category: "player",
      examples: "サムネイル 5",
      usage: "サムネイル [検索パネル中のインデックス]",
      argument: [
        {
          type: "integer",
          name: "index",
          description: "検索パネル中のインデックスを指定するとその項目のサムネイルを表示します",
          required: false,
        },
      ],
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, options: CommandArgs) {
    options.server.updateBoundChannel(message);
    const embed = new Helper.MessageEmbedBuilder();
    embed.setColor(getColor("THUMB"));
    const userSearchPanel = options.server.getSearchPanel(message.member.id);
    const rawArgNumber = Number(options.rawArgs);
    if(
      options.rawArgs &&
      userSearchPanel &&
      0 < rawArgNumber &&
      rawArgNumber <= userSearchPanel.options.length
    ) {
      const opt = userSearchPanel.options[rawArgNumber - 1];
      embed
        .setImage(opt.thumbnail)
        .setTitle(opt.title)
        .setDescription("URL: " + opt.url);
    }else if(
      !options.rawArgs &&
      options.server.player.isPlaying &&
      options.server.queue.length >= 1
    ) {
      const info = options.server.queue.get(0).basicInfo;
      embed.setTitle(info.Title).setDescription("URL: " + info.Url);
      if(typeof info.Thumbnail === "string") {
        embed.setImage(info.Thumbnail);
        await message
          .reply({
            embeds: [embed.toEris()],
          })
          .catch(e => Util.logger.log(e, "error"));
      }else{
        embed.setImage("attachment://thumbnail." + info.Thumbnail.ext);
        await message
          .reply({
            embeds: [embed.toEris()],
            files: [
              {
                name: "thumbnail." + info.Thumbnail.ext,
                file: info.Thumbnail.data,
              },
            ],
          })
          .catch(e => Util.logger.log(e, "error"));
      }
    }else{
      message.reply("✘検索結果が見つかりません").catch(e => Util.logger.log(e, "error"));
      return;
    }

    await message
      .reply({
        embeds: [embed.toEris()],
      })
      .catch(e => Util.logger.log(e, "error"));
  }
}
