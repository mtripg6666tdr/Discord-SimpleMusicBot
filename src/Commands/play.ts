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
import type * as ytsr from "ytsr";

import { BaseCommand } from ".";
import { searchYouTube } from "../AudioSource";
import { Util } from "../Util";

export default class Play extends BaseCommand {
  constructor(){
    super({
      name: "再生",
      alias: ["play", "p", "resume", "re"],
      description: "キュー内の楽曲を再生します。引数として対応しているサイトの楽曲のURLを指定することもできます。",
      unlist: false,
      category: "player",
      argument: [{
        type: "string",
        name: "keyword",
        description: "再生する動画のキーワードまたはURL。VCに未接続の場合接続してその曲を優先して再生します。接続中の場合はキューの末尾に追加します。一時停止中の場合はオプションは無視され、再生が再開されます。",
        required: false,
      }],
      requiredPermissionsOr: [],
      shouldDefer: true,
    });
  }

  async run(message: CommandMessage, options: CommandArgs){
    options.server.updateBoundChannel(message);
    const server = options.server;
    // キューが空だし引数もないし添付ファイルもない
    if(server.queue.length === 0 && options.rawArgs === "" && message.attachments.length === 0 && !(message["_message"] && message["_message"].referencedMessage)){
      await message.reply("再生するコンテンツがありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const wasConnected = server.player.isConnecting;
    // VCに入れない
    if(!await options.server.joinVoiceChannel(message, /* reply */ false, /* reply when failed */ true)) return;
    // 一時停止されてるね
    if(options.rawArgs === "" && server.player.isPaused){
      server.player.resume();
      await message.reply({
        content: `${options.includeMention ? `<@${message.member.id}> ` : ""}:arrow_forward: 再生を再開します。`,
        allowedMentions: {
          users: false,
        },
      }).catch(e => Util.logger.log(e, "error"));
      return;
    }
    // 引数ついてたらそれ優先
    if(options.rawArgs !== ""){
      if(options.rawArgs.startsWith("http://") || options.rawArgs.startsWith("https://")){
        await options.server.playFromURL(message, options.args as string[], !wasConnected);
      }else{
        const msg = await message.channel.createMessage("🔍検索中...");
        try{
          const result = (await searchYouTube(options.rawArgs)).items.filter(it => it.type === "video") as ytsr.Video[];
          if(result.length === 0){
            await message.reply(":face_with_monocle:該当する動画が見つかりませんでした");
            await msg.delete();
            return;
          }
          await options.server.playFromURL(message, result[0].url, !wasConnected, options.server.queue.length >= 1);
          await msg.delete();
        }
        catch(e){
          Util.logger.log(e, "error");
          message.reply("✗内部エラーが発生しました").catch(er => Util.logger.log(er, "error"));
          msg.delete().catch(er => Util.logger.log(er, "error"));
        }
      }
    // 添付ファイルを確認
    }else if(message.attachments.length > 0){
      await options.server.playFromURL(message, message.attachments[0].url, !wasConnected);
    // 返信先のメッセージを確認
    }else if(message["_message"]?.referencedMessage){
      const messageReference = message["_message"].referencedMessage;
      const prefixLength = server.prefix.length;
      // URLのみのメッセージか？
      if(messageReference.content.startsWith("http://") || messageReference.content.startsWith("https://")){
        await options.server.playFromURL(message, messageReference.content, !wasConnected);
      // プレフィックス+URLのメッセージか？
      }else if(messageReference.content.substring(prefixLength).startsWith("http://") || messageReference.content.substring(prefixLength).startsWith("https://")){
        await options.server.playFromURL(message, messageReference.content.substring(prefixLength), !wasConnected);
      // 添付ファイル付きか？
      }else if(messageReference.attachments.length > 0){
        await options.server.playFromURL(message, messageReference.attachments[0].url, !wasConnected);
      // ボットのメッセージなら
      }else if(messageReference.author.id === options.client.user.id){
        const embed = messageReference.embeds[0];
        // 曲関連のメッセージならそれをキューに追加
        if(embed.color === Util.color.getColor("SONG_ADDED") || embed.color === Util.color.getColor("AUTO_NP") || embed.color === Util.color.getColor("NP")){
          const url = embed.description.match(/^\[.+\]\((?<url>https?.+)\)/)?.groups.url;
          await options.server.playFromURL(message, url, !wasConnected);
        }else{
          await message.reply(":face_with_raised_eyebrow:返信先のメッセージに再生できるコンテンツが見つかりません").catch(e => Util.logger.log(e, "error"));
        }
      }else{
        await message.reply(":face_with_raised_eyebrow:返信先のメッセージに再生できるコンテンツが見つかりません").catch(e => Util.logger.log(e, "error"));
      }
    // なにもないからキューから再生
    }else if(server.queue.length >= 1){
      if(!server.player.isPlaying && !server.player.preparing){
        await message.reply("再生します").catch(e => Util.logger.log(e, "error"));
        await server.player.play();
      }else{
        await message.reply("すでに再生中です").catch(e => Util.logger.log(e, "error"));
      }
    }else{
      await message.reply("✘キューが空です").catch(e => Util.logger.log(e, "error"));
    }
  }
}
