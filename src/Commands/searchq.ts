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
import type { EmbedField } from "oceanic.js";

import { MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import * as Util from "../Util";
import { getColor } from "../Util/color";

export default class Searchq extends BaseCommand {
  constructor(){
    super({
      name: "キュー内を検索",
      alias: ["searchqueue", "searchq", "seq", "sq"],
      description: "キュー内を検索します。引数にキーワードを指定します。",
      unlist: false,
      category: "playlist",
      examples: "seq milk boy",
      usage: "seq <キーワード>",
      argument: [{
        type: "string",
        name: "keyword",
        description: "検索したい楽曲のキーワード",
        required: true,
      }],
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: true,
    });
  }

  async run(message: CommandMessage, options: CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.server.queue.length === 0){
      message.reply("✘キューが空です").catch(this.logger.error);
      return;
    }
    const qsresult = options.server.queue
      .filter(c =>
        c.basicInfo.title.toLowerCase().includes(options.rawArgs.toLowerCase())
        || c.basicInfo.url.toLowerCase().includes(options.rawArgs.toLowerCase())
        || c.basicInfo.description.toLowerCase().includes(options.rawArgs.toLowerCase())
      )
    ;
    if(qsresult.length === 0){
      message.reply(":confused:見つかりませんでした").catch(this.logger.error);
      return;
    }
    if(qsresult.length > 20) qsresult.splice(20);
    const fields = qsresult.map(c => {
      const index = options.server.queue.findIndex(d => d.basicInfo.title === c.basicInfo.title).toString();
      const _t = c.basicInfo.lengthSeconds;
      const [min, sec] = Util.time.calcMinSec(_t);
      return {
        name: index === "0" ? "現在再生中/再生待ち" : index,
        value: `[${c.basicInfo.title}](${c.basicInfo.url})\r\nリクエスト: \`${c.additionalInfo.addedBy.displayName}\` \r\n長さ: ${
          c.basicInfo.isYouTube() && c.basicInfo.isLiveStream ? "(ライブストリーム)" : ` \`${_t === 0 ? "(不明)" : `${min}:${sec}`}\`)`
        }`,
        inline: false,
      } as EmbedField;
    });
    const embed = new MessageEmbedBuilder()
      .setTitle(`"${options.rawArgs}"の検索結果✨`)
      .setDescription("キュー内での検索結果です。最大20件表示されます。")
      .setFields(...fields)
      .setColor(getColor("SEARCH"))
      .toOceanic()
    ;
    message.reply({ embeds: [embed] });
  }
}
