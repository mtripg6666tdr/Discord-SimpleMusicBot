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
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
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
