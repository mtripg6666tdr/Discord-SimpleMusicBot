import * as discord from "discord.js";
import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { getColor } from "../Util/colorUtil";
import { log } from "../Util";

export default class Help extends BaseCommand {
  constructor(){
    super({
      name: "ヘルプ",
      alias: ["help"],
      description: "ヘルプを表示します",
      unlist: false,
      category: "bot",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    const developer = await options.client.users.fetch("593758391395155978").catch(_ => null);
    const embed = new discord.MessageEmbed()
      .setTitle(options.client.user.username + ":notes:")
      .setDescription(
        "高音質な音楽を再生して、Discordでのエクスペリエンスを最高にするため作られました:robot:\r\n"
      + "利用可能なコマンドを確認するには、`" + options.data[message.guild.id].PersistentPref.Prefix + "command`を使用してください。")
      .addField("開発者", `[${(developer || {}).username ?? "mtripg6666tdr"}](https://github.com/mtripg6666tdr)`)
      .addField("バージョン", "`" + options.bot.Version + "`")
      .addField("レポジトリ/ソースコード","https://github.com/mtripg6666tdr/Discord-SimpleMusicBot")
      .addField("サポートサーバー", "https://discord.gg/7DrAEXBMHe")
      .addField("現在対応している再生ソース", 
        "・YouTube(キーワード検索)\r\n"
      + "・YouTube(動画URL指定)\r\n"
      + "・YouTube(プレイリストURL指定)\r\n"
      + "・SoundCloud(キーワード検索)\r\n"
      + "・SoundCloud(楽曲ページURL指定)\r\n"
      + "・Streamable(動画ページURL指定)\r\n"
      + "・Discord(音声ファイルの添付付きメッセージのURL指定)\r\n"
      + "・Googleドライブ(音声ファイルの限定公開リンクのURL指定)\r\n"
      + "・ニコニコ動画(動画ページURL指定)\r\n"
      + "・オーディオファイルへの直URL"
      )
      .setColor(getColor("HELP"));
    message.reply({embeds:[embed]}).catch(e => log(e, "error"));
  }
}
