import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { getColor } from "../Util/colorUtil";
import { log } from "../Util/util";

export default class Help implements CommandInterface {
  name = "ヘルプ";
  alias = ["help"];
  description = "ヘルプを表示します。";
  unlist = false;
  category = "bot";
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    const embed = new discord.MessageEmbed();
    embed.title = options.client.user.username + ":notes:";
    embed.description = "高音質な音楽を再生して、Discordでのエクスペリエンスを最高にするため作られました:robot:\r\n"
    + "利用可能なコマンドを確認するには、`" + options.data[message.guild.id].PersistentPref.Prefix + "command`を使用してください。";
    embed.addField("開発者", "[" + options.client.users.resolve("593758391395155978").username + "](https://github.com/mtripg6666tdr)");
    embed.addField("バージョン", "`" + options.bot.Version + "`");
    embed.addField("レポジトリ/ソースコード","https://github.com/mtripg6666tdr/Discord-SimpleMusicBot");
    embed.addField("サポートサーバー", "https://discord.gg/7DrAEXBMHe")
    embed.addField("現在対応している再生ソース", 
      "・YouTube(キーワード検索)\r\n"
    + "・YouTube(動画URL指定)\r\n"
    + "・YouTube(プレイリストURL指定)\r\n"
    + "・SoundCloud(キーワード検索)\r\n"
    + "・SoundCloud(楽曲ページURL指定)\r\n"
    + "・Streamable(動画ページURL指定)\r\n"
    + "・Discord(音声ファイルの添付付きメッセージのURL指定)\r\n"
    + "・Googleドライブ(音声ファイルの限定公開リンクのURL指定)\r\n"
    + "・オーディオファイルへの直URL"
    );
    embed.setColor(getColor("HELP"));
    message.channel.send({embeds:[embed]}).catch(e => log(e, "error"));
  }
}