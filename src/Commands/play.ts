/*
 * Copyright 2021-2024 mtripg6666tdr
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
import type * as dYtsr from "@distube/ytsr";
import type * as ytsr from "ytsr";

import { ApplicationCommandTypes } from "oceanic.js";

import { BaseCommand } from ".";
import { searchYouTube } from "../AudioSource";

export default class Play extends BaseCommand {
  constructor(){
    super({
      alias: ["play", "p", "resume", "re"],
      unlist: false,
      category: "player",
      args: [
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
      usage: false,
      examples: false,
      requiredPermissionsOr: [],
      shouldDefer: true,
      messageCommand: true,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs){
    const { t } = context;

    const server = context.server;
    const firstAttachment = Array.isArray(message.attachments) ? message.attachments[0] : message.attachments.first();


    // キューが空だし引数もないし添付ファイルもない
    if(
      server.queue.length === 0
      && context.rawArgs === ""
      && !firstAttachment
      && !(message["_message"] && message["_message"].referencedMessage)
      && !(message["_interaction"] && "type" in message["_interaction"].data && message["_interaction"].data.type === ApplicationCommandTypes.MESSAGE)
    ){
      await message.reply(t("commands:play.noContent")).catch(this.logger.error);
      return;
    }

    const wasConnected = server.player.isConnecting;
    //VCに入れない
    if(!await context.server.joinVoiceChannel(message, { replyOnFail: true })){
      return;
    }

    // 一時停止されてるね
    if(context.rawArgs === "" && server.player.isPaused){
      server.player.resume();
      await message.reply({
        content: `${context.includeMention ? `<@${message.member.id}> ` : ""} :arrow_forward:${t("commands:play.resuming")}`,
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
        await context.server.playFromUrl(message, context.args as string[], { first: !wasConnected });
      }else{
        // URLでないならキーワードとして検索
        const msg = await message.channel.createMessage({
          content: `🔍${t("search.searching")}...`,
        });

        try{
          let videos: ytsr.Video[] | dYtsr.Video[] = null!;

          if(context.bot.cache.hasSearch(context.rawArgs)){
            videos = await context.bot.cache.getSearch(context.rawArgs);
          }else{
            const result = await searchYouTube(context.rawArgs);
            videos = (result.items as (ytsr.Item | dYtsr.Video)[]).filter(it => it.type === "video") as (ytsr.Video[] | dYtsr.Video[]);
            context.bot.cache.addSearch(context.rawArgs, videos);
          }

          if(videos.length === 0){
            await Promise.allSettled([
              message.reply(`:face_with_monocle: ${t("commands:play.noMusicFound")}`),
              msg.delete(),
            ]);
            return;
          }

          await Promise.allSettled([
            context.server.playFromUrl(message, videos[0].url, { first: !wasConnected, cancellable: context.server.queue.length >= 1 }),
            msg.delete().catch(this.logger.error),
          ]);
        }
        catch(e){
          this.logger.error(e);
          message.reply(`✗ ${t("internalErrorOccurred")}`).catch(this.logger.error);
          msg.delete().catch(this.logger.error);
        }
      }
    }else if(firstAttachment){
      // 添付ファイルを確認
      await context.server.playFromUrl(
        message,
        firstAttachment.url,
        { first: !wasConnected },
      );
    }else if(message["_message"]?.referencedMessage){
      // 返信先のメッセージを確認
      const messageReference = message["_message"].referencedMessage;
      if(messageReference.inCachedGuildChannel()){
        context.server
          .playFromMessage(message, messageReference, context, { first: !wasConnected })
          .catch(this.logger.error);
      }
    }else if(message["_interaction"] && "type" in message["_interaction"].data && message["_interaction"].data.type === ApplicationCommandTypes.MESSAGE){
      const messageReference = message["_interaction"].data.resolved.messages.first();
      if(messageReference?.inCachedGuildChannel()){
        context.server
          .playFromMessage(message, messageReference, context, { first: !wasConnected })
          .catch(this.logger.error);
      }
    }else if(server.queue.length >= 1){
      // なにもないからキューから再生
      if(!server.player.isPlaying && !server.player.preparing){
        await message.reply(t("commands:play.playing")).catch(this.logger.error);
        await server.player.play({ bgm: false });
      }else{
        await message.reply(t("commands:play.alreadyPlaying")).catch(this.logger.error);
      }
    }else{
      await message.reply(`✘ ${t("commands:play.queueEmpty")}`).catch(this.logger.error);
    }
  }
}
