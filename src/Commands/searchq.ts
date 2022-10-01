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
import type { EmbedField } from "eris";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class Searchq extends BaseCommand {
  constructor(){
    super({
      name: "キュー内を検索",
      alias: ["searchq", "seq", "sq"],
      description: "キュー内を検索します。引数にキーワードを指定します。",
      unlist: false,
      category: "playlist",
      examples: "seq milk boy",
      usage: "seq <キーワード>",
      argument: [{
        type: "string",
        name: "keyword",
        description: "検索したい楽曲のキーワード",
        required: true
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(!Util.eris.user.isPrivileged(message.member) && options.server.player.isConnecting && !Util.eris.channel.sameVC(message.member, options)){
      message.reply("この操作を実行する権限がありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.updateBoundChannel(message);
    if(options.server.queue.length === 0){
      message.reply("✘キューが空です").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const qsresult = options.server.queue
      .filter(c =>
        c.basicInfo.Title.toLowerCase().includes(options.rawArgs.toLowerCase())
        || c.basicInfo.Url.toLowerCase().includes(options.rawArgs.toLowerCase())
        || c.basicInfo.Description.toLowerCase().includes(options.rawArgs.toLowerCase())
      )
    ;
    if(qsresult.length === 0){
      message.reply(":confused:見つかりませんでした").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(qsresult.length > 20) qsresult.splice(20);
    const fields = qsresult.map(c => {
      const index = options.server.queue.findIndex(d => d.basicInfo.Title === c.basicInfo.Title).toString();
      const _t = c.basicInfo.LengthSeconds;
      const [min, sec] = Util.time.CalcMinSec(_t);
      return {
        name: index === "0" ? "現在再生中/再生待ち" : index,
        value: `[${c.basicInfo.Title}](${c.basicInfo.Url})\r\nリクエスト: \`${c.additionalInfo.addedBy.displayName}\` \r\n長さ: ${
          (c.basicInfo.isYouTube() && c.basicInfo.LiveStream) ? "(ライブストリーム)" : ` \`${_t === 0 ? "(不明)" : `${min}:${sec}`}\`)`
        }`,
        inline: false
      } as EmbedField;
    });
    const embed = new Helper.MessageEmbedBuilder()
      .setTitle(`"${options.rawArgs}"の検索結果✨`)
      .setDescription("キュー内での検索結果です。最大20件表示されます。")
      .setFields(...fields)
      .setColor(getColor("SEARCH"))
      .toEris()
    ;
    message.reply({embeds: [embed]});
  }
}
