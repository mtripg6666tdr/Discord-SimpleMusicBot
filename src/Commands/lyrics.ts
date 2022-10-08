/*
 * Copyright 2021-2022 mtripg6666tdr
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
import type { MessageEmbedBuilder } from "@mtripg6666tdr/eris-command-resolver";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";
import { GetLyrics } from "../Util/lyrics";

export default class Lyrics extends BaseCommand {
  constructor(){
    super({
      name: "歌詞",
      alias: ["lyrics", "l", "lyric"],
      description: "指定された曲の歌詞を検索します。`utaten`をキーワードに入れると、Utatenを優先して検索します。",
      unlist: false,
      category: "utility",
      examples: "l 夜に駆ける",
      usage: "l <タイトル、アーティスト等>",
      argument: [{
        type: "string",
        name: "keyword",
        description: "楽曲を検索するキーワード",
        required: true
      }],
      permissionDescription: "なし",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    const msg = await message.reply("🔍検索中...");
    try{
      const songInfo = await GetLyrics(options.rawArgs);
      const embeds = [] as MessageEmbedBuilder[];
      if(!songInfo.lyric) throw new Error("取得した歌詞が空でした");
      const chunkLength = Math.ceil(songInfo.lyric.length / 4000);
      for(let i = 0; i < chunkLength; i++){
        const partial = songInfo.lyric.substring(4000 * i, 4000 * (i + 1) - 1);
        embeds.push(
          new Helper.MessageEmbedBuilder()
            .setDescription(partial)
            .setColor(getColor("LYRIC"))
        );
      }
      embeds[0]
        .setTitle("\"" + songInfo.title + "\"(" + songInfo.artist + ")の歌詞")
        .setURL(songInfo.url)
        .setThumbnail(songInfo.artwork)
      ;
      embeds[embeds.length - 1]
        .setFooter({
          text: Util.eris.user.getDisplayName(message.member),
          icon_url: message.member.avatarURL
        })
      ;
      msg.edit({
        content: "",
        embeds: embeds.map(embed => embed.toEris())
      });
    }
    catch(e){
      Util.logger.log(e, "error");
      await msg.edit(":confounded:失敗しました。曲名を確認してもう一度試してみてください。").catch(er => Util.logger.log(er, "error"));
    }
  }
}
