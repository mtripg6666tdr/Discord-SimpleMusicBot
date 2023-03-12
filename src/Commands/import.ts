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
import type { CommandMessage } from "../Component/commandResolver/CommandMessage";
import type { YmxFormat } from "../Structure";
import type { AnyGuildTextChannel } from "oceanic.js";

import candyget from "candyget";

import { BaseCommand } from ".";
import { TaskCancellationManager } from "../Component/TaskCancellationManager";
import { YmxVersion } from "../Structure";
import { useConfig } from "../config";

const config = useConfig();

export default class Import extends BaseCommand {
  constructor(){
    super({
      alias: ["import"],
      unlist: false,
      category: "playlist",
      argument: [{
        type: "string",
        name: "url",
        required: true,
      }],
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, context: CommandArgs){
    context.server.updateBoundChannel(message);
    if(context.rawArgs === ""){
      message.reply("❓インポート元のキューが埋め込まれたメッセージのURLを引数として渡してください。").catch(this.logger.error);
      return;
    }
    let force = false;
    let url = context.rawArgs;
    if(context.args.length >= 2 && context.args[0] === "force" && config.isBotAdmin(message.member.id)){
      force = true;
      url = context.args[1];
    }
    if(!url.startsWith("http://discord.com/channels/") && !url.startsWith("https://discord.com/channels/")){
      await message.reply("❌Discordのメッセージへのリンクを指定してください").catch(this.logger.error);
      return;
    }

    const ids = url.split("/");
    if(ids.length < 2){
      await message.reply("🔗指定されたURLは無効です");
      return;
    }

    const smsg = await message.reply("🔍メッセージを取得しています...");
    const cancellation = context.server.bindCancellation(new TaskCancellationManager());
    try{
      // get the message
      const targetChannelId = ids[ids.length - 2];
      const targetMessageId = ids[ids.length - 1];
      const channel = await context.client.rest.channels.get<AnyGuildTextChannel>(targetChannelId);
      const msg = channel.guild && await channel.getMessage(targetMessageId);
      if(msg.author.id !== context.client.user.id && !force){
        await smsg.edit("❌ボットのメッセージではありません");
        return;
      }

      // extract an embed and an attachment
      const embed = msg.embeds.length > 0 ? msg.embeds[0] : null;
      const attac = msg.attachments.size > 0 ? msg.attachments.first() : null;


      if(embed && embed.title.endsWith("のキュー")){
        // if embed detected
        const fields = embed.fields;
        for(let i = 0; i < fields.length; i++){
          const lines = fields[i].value.split("\r\n");
          const tMatch = lines[0].match(/\[(?<title>.+)\]\((?<url>.+)\)/);
          await context.server.queue.addQueueOnly({
            url: tMatch.groups.url,
            addedBy: message.member,
          });
          await smsg.edit(`${fields.length}曲中${i + 1}曲処理しました。`);
          if(cancellation.Cancelled) break;
        }
        if(!cancellation.Cancelled){
          await smsg.edit(`✅${fields.length}曲を処理しました`);
        }else{
          await smsg.edit("✅キャンセルされました");
        }
      }else if(attac && attac.filename.endsWith(".ymx")){
        // if an attachment is ymx
        const raw = await candyget.json(attac.url).then(({ body }) => body) as YmxFormat;

        if(raw.version !== YmxVersion){
          await smsg.edit("✘指定されたファイルはバージョンに互換性がないためインポートできません(現行:v" + YmxVersion + "; ファイル:v" + raw.version + ")");
          return;
        }

        const qs = raw.data;
        for(let i = 0; i < qs.length; i++){
          await context.server.queue.addQueueOnly({
            url: qs[i].url,
            addedBy: message.member,
            gotData: qs[i],
          });
          if(qs.length <= 10 || i % 10 === 9){
            await smsg.edit(qs.length + "曲中" + (i + 1) + "曲処理しました。");
          }
          if(cancellation.Cancelled) break;
        }

        if(!cancellation.Cancelled){
          await smsg.edit(`✅${qs.length}曲を処理しました`);
        }else{
          await smsg.edit("✅キャンセルされました");
        }
      }else{
        await smsg.edit("❌キューの埋め込みもしくは添付ファイルが見つかりませんでした");
        return;
      }
    }
    catch(e){
      this.logger.error(e);
      smsg?.edit(":sob:失敗しました...");
    }
    finally{
      context.server.unbindCancellation(cancellation);
    }
  }
}
