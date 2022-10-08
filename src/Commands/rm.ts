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

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Rm extends BaseCommand {
  constructor(){
    super({
      name: "削除",
      alias: ["消去", "rm", "remove"],
      description: "キュー内の指定された位置の曲を削除します。",
      unlist: false,
      category: "playlist",
      examples: "rm 5",
      usage: "削除 <削除する位置>",
      argument: [{
        type: "string",
        name: "index",
        description: "削除するインデックスはキューに併記されているものです。ハイフンを使って2-5のように範囲指定したり、スペースを使って1 4 8のように複数指定することも可能です。",
        required: true
      }],
      permissionDescription: "削除対象の楽曲を追加した人、またはユーザーがDJロールを保持"
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(options.args.length === 0){
      message.reply("引数に消去する曲のオフセット(番号)を入力してください。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(options.args.includes("0") && options.server.player.isPlaying){
      message.reply("現在再生中の楽曲を削除することはできません。");
      return;
    }
    options.server.updateBoundChannel(message);
    const q = options.server.queue;
    const addition = [] as number[];
    options.args.forEach(o => {
      let match = o.match(/^(?<from>[0-9]+)-(?<to>[0-9]+)$/);
      if(match){
        const from = Number(match.groups.from);
        const to = Number(match.groups.to);
        if(!isNaN(from) && !isNaN(to) && from <= to){
          for(let i = from; i <= to; i++){
            addition.push(i);
          }
        }
      }else{
        match = o.match(/^(?<from>[0-9]+)-$/);
        if(match){
          const from = Number(match.groups.from);
          if(!isNaN(from)){
            for(let i = from; i < q.length; i++){
              addition.push(i);
            }
          }
        }else{
          match = o.match(/^-(?<to>[0-9]+)$/);
          if(match){
            const to = Number(match.groups.to);
            if(!isNaN(to)){
              for(let i = (options.server.player.isPlaying ? 1 : 0); i <= to; i++){
                addition.push(i);
              }
            }
          }
        }
      }
    });
    const indexes = options.args.concat(addition.map(n => n.toString()));
    const dels = Array.from(
      new Set(
        indexes
          .map(str => Number(str))
          .filter(n => !isNaN(n))
          .sort((a, b) => b - a)
      )
    );
    const actualDeleted = [] as number[];
    const failed = [] as number[];
    for(let i = 0; i < dels.length; i++){
      const item = q.get(dels[i]);
      if(
        Util.eris.user.isDJ(message.member, options)
        || item.additionalInfo.addedBy.userId === message.member.id
        || !Util.eris.channel.getVoiceMember(options).has(item.additionalInfo.addedBy.userId)
        || Util.eris.channel.isOnlyListener(message.member, options)
        || Util.eris.user.isPrivileged(message.member)
      ){
        q.removeAt(dels[i]);
        actualDeleted.push(dels[i]);
      }else{
        failed.push(dels[i]);
      }
    }
    if(actualDeleted.length > 0){
      const title = actualDeleted.length === 1 ? q.get(actualDeleted[0]).basicInfo.Title : null;
      const resultStr = actualDeleted.sort((a, b) => a - b).join(",");
      const failedStr = failed.sort((a, b) => a - b).join(",");
      message.reply(`🚮${resultStr.length > 100 ? "指定された" : `${resultStr}番目の`}曲${title ? ("(`" + title + "`)") : ""}を削除しました${failed.length > 0 ? `\r\n:warning:${failed.length > 100 ? "一部" : `${failedStr}番目`}の曲は権限がないため削除できませんでした。` : ""}`).catch(e => Util.logger.log(e, "error"));
    }else{
      message.reply("削除できませんでした。権限が不足している可能性があります。").catch(e => Util.logger.log(e, "error"));
    }
  }
}
