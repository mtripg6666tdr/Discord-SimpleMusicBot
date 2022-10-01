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
import type { ResponseMessage } from "../Component/ResponseMessage";
import type { YmxFormat } from "../Structure";

import { BaseCommand } from ".";
import { TaskCancellationManager } from "../Component/TaskCancellationManager";
import { YmxVersion } from "../Structure";
import { Util } from "../Util";

export default class Import extends BaseCommand {
  constructor(){
    super({
      name: "インポート",
      alias: ["import"],
      description: "指定されたメッセージからキューをインポートします。exportコマンドで出力されたファイルが添付されたURL、もしくはキューの埋め込みのあるメッセージのURLを引数として指定してください。",
      unlist: false,
      category: "playlist",
      examples: "import https://discord.com/channels/...",
      usage: "インポート <インポート元のURL>",
      argument: [{
        type: "string",
        name: "url",
        description: "インポート元のメッセージのURL。exportコマンドで出力されたymxファイルが添付されたメッセージのURL、もしくはキューの埋め込みが添付されたURLを指定できます。",
        required: true
      }],
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(!Util.eris.user.isPrivileged(message.member) && options.server.player.isConnecting && !Util.eris.channel.sameVC(message.member, options)){
      message.reply("この操作を実行する権限がありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.updateBoundChannel(message);
    if(options.rawArgs === ""){
      message.reply("❓インポート元のキューが埋め込まれたメッセージのURLを引数として渡してください。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    let force = false;
    let url = options.rawArgs;
    if(options.args.length >= 2 && options.args[0] === "force" && message.member.id === "593758391395155978"){
      force = true;
      url = options.args[1];
    }
    if(url.startsWith("http://discord.com/channels/") || url.startsWith("https://discord.com/channels/")){
      let smsg = null as ResponseMessage;
      const cancellation = options.server.bindCancellation(new TaskCancellationManager());
      try{
        smsg = await message.reply("🔍メッセージを取得しています...");
        const ids = url.split("/");
        if(ids.length < 2){
          await smsg.edit("🔗指定されたURLは無効です");
        }
        const msgId = ids[ids.length - 1];
        const chId = ids[ids.length - 2];
        const msg = await options.client.getMessage(chId, msgId);
        if(msg.author.id !== options.client.user.id && !force){
          await smsg.edit("❌ボットのメッセージではありません");
          return;
        }
        const embed = msg.embeds.length > 0 ? msg.embeds[0] : null;
        const attac = msg.attachments.length > 0 ? msg.attachments[0] : null;
        if(embed && embed.title.endsWith("のキュー")){
          const fields = embed.fields;
          for(let i = 0; i < fields.length; i++){
            const lines = fields[i].value.split("\r\n");
            const tMatch = lines[0].match(/\[(?<title>.+)\]\((?<url>.+)\)/);
            await options.server.queue.autoAddQueue(options.client, tMatch.groups.url, message.member, "unknown");
            await smsg.edit(fields.length + "曲中" + (i + 1) + "曲処理しました。");
            if(cancellation.Cancelled) break;
          }
          if(!cancellation.Cancelled){
            await smsg.edit("✅" + fields.length + "曲を処理しました");
          }else{
            await smsg.edit("✅キャンセルされました");
          }
        }else if(attac && attac.filename.endsWith(".ymx")){
          const raw = JSON.parse(await Util.web.DownloadText(attac.url)) as YmxFormat;
          if(raw.version !== YmxVersion){
            await smsg.edit("✘指定されたファイルはバージョンに互換性がないためインポートできません(現行:v" + YmxVersion + "; ファイル:v" + raw.version + ")");
            return;
          }
          const qs = raw.data;
          for(let i = 0; i < qs.length; i++){
            await options.server.queue.autoAddQueue(options.client, qs[i].url, message.member, "unknown", false, false, null, null, qs[i]);
            if(qs.length <= 10 || i % 10 === 9){
              await smsg.edit(qs.length + "曲中" + (i + 1) + "曲処理しました。");
            }
            if(cancellation.Cancelled) break;
          }
          if(!cancellation.Cancelled){
            await smsg.edit("✅" + qs.length + "曲を処理しました");
          }else{
            await smsg.edit("✅キャンセルされました");
          }
        }else{
          await smsg.edit("❌キューの埋め込みもしくは添付ファイルが見つかりませんでした");
          return;
        }
      }
      catch(e){
        Util.logger.log(e, "error");
        smsg?.edit("😭失敗しました...");
      }
      finally{
        options.server.unbindCancellation(cancellation);
      }
    }else{
      await message.reply("❌Discordのメッセージへのリンクを指定してください").catch(e => Util.logger.log(e, "error"));
    }
  }
}
