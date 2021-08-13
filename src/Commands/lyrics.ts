import * as discord from "discord.js";
import { CommandArgs, CommandInterface, SlashCommandArgument } from ".";
import { getColor } from "../Util/colorUtil";
import { GetLyrics } from "../Util/lyricsUtil";
import { log } from "../Util/util";

export default class Lyrics implements CommandInterface {
  name = "歌詞";
  alias = ["l", "lyric", "lyrics"];
  description = "指定された曲の歌詞を検索します。`utaten`をキーワードに入れると、Utatenを優先して検索します。";
  unlist = false;
  category = "utility";
  examples = "l 夜に駆ける";
  usage = "l <タイトル、アーティスト等>";
  argument = [{
    type: "string",
    name: "keyword",
    description: "楽曲を検索するキーワード",
    required: true
  }] as SlashCommandArgument[];
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!process.env.CSE_KEY) return;
    const msg = await message.channel.send("🔍検索中...");
    try{
      const song = await GetLyrics(options.rawArgs);
      const embed = new discord.MessageEmbed();
      embed.title = "\"" + song.title + "\"(" + song.artist + ")の歌詞";
      embed.footer = {
        text: message.member.displayName,
        iconURL: message.author.avatarURL()
      };
      embed.setColor(getColor("LYRIC"));
      embed.description = song.lyric;
      embed.url = song.url;
      embed.thumbnail = {
        url: song.artwork
      }
      msg.edit({content: null, embeds:[embed]});
    }
    catch(e){
      log(e, "error");
      msg.edit(":confounded:失敗しました。曲名を確認してもう一度試してみてください。").catch(e => log(e, "error"));
      return;
    }
  }
}