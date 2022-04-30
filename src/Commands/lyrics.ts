import * as discord from "discord.js";
import { CommandArgs, BaseCommand, SlashCommandArgument } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { getColor } from "../Util/colorUtil";
import { GetLyrics } from "../Util/lyricsUtil";
import { log } from "../Util";

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
      const embeds = [] as discord.MessageEmbed[];
      if(!songInfo.lyric) throw new Error("取得した歌詞が空でした");
      const chunkLength = Math.ceil(songInfo.lyric.length / 4000);
      for(let i = 0; i < chunkLength; i++){
        const partial = songInfo.lyric.substring(4000 * i, 4000 * (i + 1) - 1);
        embeds.push(
          new discord.MessageEmbed()
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
        .setFooter({text: message.member.displayName, iconURL: message.author.avatarURL()})
      ;
      msg.edit({content: null, embeds});
    }
    catch(e){
      log(e, "error");
      msg.edit(":confounded:失敗しました。曲名を確認してもう一度試してみてください。").catch(e => log(e, "error"));
      return;
    }
  }
}