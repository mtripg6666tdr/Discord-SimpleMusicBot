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
import type { ResponseMessage } from "@mtripg6666tdr/eris-command-resolver";
import type { Message } from "eris";

import { BaseCommand } from ".";
import Util from "../Util";

export default class BulkDelete extends BaseCommand {
  constructor(){
    super({
      name: "バルク削除",
      alias: ["bulk-delete", "bulkdelete"],
      description: "ボットが送信したメッセージを一括削除します。過去1000件のメッセージを遡って検索します。",
      unlist: true,
      category: "utility",
      usage: "バルク削除 <メッセージ数>",
      examples: "バルク削除 10",
      argument: [
        {
          type: "integer",
          name: "count",
          description: "削除するメッセージの上限数。100以下で設定してください。",
          required: true,
        }
      ]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(!message.member.permissions.has("manageMessages")){
      await message.reply(":warning:この操作を実行する権限がありません").catch(e => Util.logger.log(e));
      return;
    }
    const count = Number(options.args[0]);
    if(isNaN(count)){
      await message.reply(":warning:指定されたメッセージ数が無効です。");
      return;
    }
    const reply = await message.reply(":mag:取得中...").catch(e => Util.logger.log(e, "error")) as ResponseMessage;
    try{
      let before = "";
      const messages = [] as Message[];
      let i = 0;
      do {
        const allMsgs = await options.client.getMessages(message.channel.id, before ? {
          limit: 100,
          before,
        } : {
          limit: 100,
        });
        if(allMsgs.length === 0) break;
        const msgs = allMsgs.filter(_msg => _msg.author.id === options.client.user.id && _msg.id !== reply.id);
        msgs.sort((a, b) => b.createdAt - a.createdAt);
        messages.push(...msgs);
        before = allMsgs.at(-1).id;
        i++;
        await reply.edit(`:mag:取得中(${messages.length}件ヒット/取得した${i * 100}件中)...`);
      } while(messages.length < count && i <= 10);
      if(messages.length > count) messages.splice(count);
      await reply.edit(messages.length + "件見つかりました。削除を実行します。");
      await options.client.deleteMessages(message.channel.id, messages.map(msg => msg.id), `${message.member.username}#${message.member.discriminator}により${count}件のメッセージの削除が要求されたため。`);
      await reply.edit(":sparkles:完了!(このメッセージは自動的に消去されます)");
      setTimeout(() => reply.delete().catch(() => {}), 10 * 1000);
    }
    catch(er){
      Util.logger.log(er, "error");
      console.error(er);
      if(reply){
        reply.edit("失敗しました...").catch(e => Util.logger.log(e, "error"));
      }
    }
  }
}
