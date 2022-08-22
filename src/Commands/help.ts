import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";

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
    const developer = await options.client.getUserProfile("593758391395155978").catch(() => null);
    const embed = new Helper.MessageEmbedBuilder()
      .setTitle(options.client.user.username + ":notes:")
      .setDescription(
        "高音質な音楽を再生して、Discordでのエクスペリエンスを最高にするため作られました:robot:\r\n"
      + "利用可能なコマンドを確認するには、`" + options.data[message.guild.id].PersistentPref.Prefix + "command`を使用してください。")
      .addField("開発者", `[${(developer || {}).username || "mtripg6666tdr"}](https://github.com/mtripg6666tdr)`)
      .addField("バージョン", "`" + options.bot.Version + "`")
      .addField("レポジトリ/ソースコード", "https://github.com/mtripg6666tdr/Discord-SimpleMusicBot")
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
      .setColor(getColor("HELP"))
      .toEris()
    ;
    await message.reply({embeds: [embed]}).catch(e => Util.logger.log(e, "error"));
  }
}
