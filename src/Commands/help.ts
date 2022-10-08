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
      permissionDescription: "なし",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    const developerId = "593758391395155978";
    const cachedUser = options.client.users.get(developerId);
    const developer = cachedUser ? cachedUser.username :
      await options.client.getRESTUser(developerId)
        .then(user => user.username)
        .catch(() => null as string)
      ;
    const embed = new Helper.MessageEmbedBuilder()
      .setTitle(options.client.user.username + ":notes:")
      .setDescription(
        "高音質な音楽を再生して、Discordでのエクスペリエンスを最高にするため作られました:robot:\r\n"
      + "利用可能なコマンドを確認するには、`" + options.server.prefix + "command`を使用してください。")
      .addField("開発者", `[${developer || "mtripg6666tdr"}](https://github.com/mtripg6666tdr)`)
      .addField("バージョン", "`" + options.bot.version + "`")
      .addField("レポジトリ/ソースコード", "https://github.com/mtripg6666tdr/Discord-SimpleMusicBot")
      .addField("サポートサーバー", "https://discord.gg/7DrAEXBMHe")
      .addField("現在対応している再生ソース", [
        "・YouTube(キーワード検索)",
        "・YouTube(動画URL指定)",
        "・YouTube(プレイリストURL指定)",
        "・SoundCloud(キーワード検索)",
        "・SoundCloud(楽曲ページURL指定)",
        "・Streamable(動画ページURL指定)",
        "・Discord(音声ファイルの添付付きメッセージのURL指定)",
        "・Googleドライブ(音声ファイルの限定公開リンクのURL指定)",
        "・ニコニコ動画(動画ページURL指定)",
        "・オーディオファイルへの直URL",
      ].join("\r\n"))
      .setColor(getColor("HELP"))
      .toEris()
    ;
    await message.reply({embeds: [embed]}).catch(e => Util.logger.log(e, "error"));
  }
}
