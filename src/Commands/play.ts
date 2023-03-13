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
import type { i18n } from "i18next";
import type * as ytsr from "ytsr";

import { BaseCommand } from ".";
import { searchYouTube } from "../AudioSource";
import { color } from "../Util";

export default class Play extends BaseCommand {
  constructor(){
    super({
      alias: ["play", "p", "resume", "re"],
      unlist: false,
      category: "player",
      argument: [
        {
          type: "string",
          name: "keyword",
          required: false,
        },
        {
          type: "file",
          name: "audiofile",
          required: false,
        },
      ],
      requiredPermissionsOr: [],
      shouldDefer: true,
    });
  }

  async run(message: CommandMessage, context: CommandArgs, t: i18n["t"]){
    context.server.updateBoundChannel(message);
    const server = context.server;
    const firstAttachment = Array.isArray(message.attachments) ? message.attachments[0] : message.attachments.first();


    // キューが空だし引数もないし添付ファイルもない
    if(
      server.queue.length === 0
      && context.rawArgs === ""
      && !firstAttachment
      && !(message["_message"] && message["_message"].referencedMessage)
    ){
      await message.reply(t("commands:play.noContent")).catch(this.logger.error);
      return;
    }

    const wasConnected = server.player.isConnecting;
    // VCに入れない
    if(!await context.server.joinVoiceChannel(message, { replyOnFail: true }, t)){
      return;
    }

    // 一時停止されてるね
    if(context.rawArgs === "" && server.player.isPaused){
      server.player.resume();
      await message.reply({
        content: `${context.includeMention ? `<@${message.member.id}> ` : ""}:arrow_forward:${t("commands:play.resuming")}`,
        allowedMentions: {
          users: false,
        },
      }).catch(this.logger.error);
      return;
    }


    if(context.rawArgs !== ""){
      // 引数ついてたらそれ優先して再生する
      if(context.rawArgs.startsWith("http://") || context.rawArgs.startsWith("https://")){
        // ついていた引数がURLなら
        await context.server.playFromURL(message, context.args as string[], { first: !wasConnected }, t);
      }else{
        // URLでないならキーワードとして検索
        const msg = await message.channel.createMessage({
          content: `🔍${t("search.searching")}...`,
        });

        try{
          let videos: ytsr.Video[] = null;
          if(context.bot.cache.hasSearch(context.rawArgs)){
            videos = await context.bot.cache.getSearch(context.rawArgs);
          }else{
            const result = await searchYouTube(context.rawArgs);
            videos = result.items.filter(it => it.type === "video") as ytsr.Video[];
            context.bot.cache.addSearch(context.rawArgs, videos);
          }
          if(videos.length === 0){
            await message.reply(`:face_with_monocle:${t("commands:play.noMusicFound")}`);
            await msg.delete();
            return;
          }
          await context.server.playFromURL(message, videos[0].url, { first: !wasConnected, cancellable: context.server.queue.length >= 1 }, t);
          await msg.delete();
        }
        catch(e){
          this.logger.error(e);
          message.reply(`✗${t("internalErrorOccurred")}`).catch(this.logger.error);
          msg.delete().catch(this.logger.error);
        }
      }
    }else if(firstAttachment){
      // 添付ファイルを確認
      await context.server.playFromURL(
        message,
        firstAttachment.url,
        { first: !wasConnected },
        t
      );
    }else if(message["_message"]?.referencedMessage){
      // 返信先のメッセージを確認
      const messageReference = message["_message"].referencedMessage;
      const prefixLength = server.prefix.length;
      if(messageReference.content.startsWith("http://") || messageReference.content.startsWith("https://")){
        // URLのみのメッセージか？
        await context.server.playFromURL(message, messageReference.content, { first: !wasConnected }, t);
      }else if(
        messageReference.content.substring(prefixLength).startsWith("http://")
        || messageReference.content.substring(prefixLength).startsWith("https://")
      ){
        // プレフィックス+URLのメッセージか？
        await context.server.playFromURL(message, messageReference.content.substring(prefixLength), { first: !wasConnected }, t);
      }else if(messageReference.attachments.size > 0){
        // 添付ファイル付きか？
        await context.server.playFromURL(message, messageReference.attachments.first().url, { first: !wasConnected }, t);
      }else if(messageReference.author.id === context.client.user.id){
        // ボットのメッセージなら
        // 埋め込みを取得
        const embed = messageReference.embeds[0];

        if(
          embed.color === color.getColor("SONG_ADDED")
          || embed.color === color.getColor("AUTO_NP")
          || embed.color === color.getColor("NP")
        ){
          // 曲関連のメッセージならそれをキューに追加
          const url = embed.description.match(/^\[.+\]\((?<url>https?.+)\)/)?.groups.url;
          await context.server.playFromURL(message, url, { first: !wasConnected }, t);
        }else{
          await message.reply(`:face_with_raised_eyebrow:${t("commands:play.noContentWhereReplyingTo")}`)
            .catch(this.logger.error);
        }
      }else{
        await message.reply(`:face_with_raised_eyebrow:${t("commands:play.noContentWhereReplyingTo")}`)
          .catch(this.logger.error);
      }
    }else if(server.queue.length >= 1){
      // なにもないからキューから再生
      if(!server.player.isPlaying && !server.player.preparing){
        await message.reply(t("commands:play.playing")).catch(this.logger.error);
        await server.player.play();
      }else{
        await message.reply(t("commands:play.alreadyPlaying")).catch(this.logger.error);
      }
    }else{
      await message.reply(`✘${t("commands:play.queueEmpty")}`).catch(this.logger.error);
    }
  }
}
