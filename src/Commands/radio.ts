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

import ytdl from "ytdl-core";

import { BaseCommand } from ".";

export default class Radio extends BaseCommand {
  constructor(){
    super({
      alias: ["radio", "radio_start"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: ["admin", "sameVc", "noConnection"],
      shouldDefer: true,
      args: [
        {
          type: "string" as const,
          name: "url",
          required: false,
        },
      ],
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs){
    const { t } = context;

    try{
      if(context.rawArgs !== "" && context.server.queue.mixPlaylistEnabled){
        await message.reply(t("commands:radio.alreadyEnabled")).catch(this.logger.error);
        return;
      }else if(context.rawArgs === "" && !context.server.queue.mixPlaylistEnabled && !context.server.player.isPlaying){
        await message.reply(t("commands:radio.noUrlSpecified")).catch(this.logger.error);
        return;
      }

      // if url specified, enable the feature
      if(context.rawArgs !== "" || (!context.server.queue.mixPlaylistEnabled && context.server.player.isPlaying)){
        // first, attempt to join to the vc
        const joinResult = await context.server.joinVoiceChannel(message, { reply: false, replyOnFail: true });
        if(!joinResult){
          return;
        }

        // validate provided url
        const videoId = this.getVideoId(context.rawArgs || context.server.player.currentAudioUrl);
        if(!videoId){
          await message.reply(t("commands:radio.invalidUrl")).catch(this.logger.error);
          return;
        }

        // setup and start to play
        const result = await context.server.queue.enableMixPlaylist(videoId, message.member, !context.rawArgs);

        if(!result){
          await message.reply(`:smiling_face_with_tear: ${t("search.notFound")}`);
          return;
        }

        await message.reply(`:white_check_mark:${
          context.rawArgs
            ? t("commands:radio.started")
            : t("commands:radio.startedFromCurrentSong")
        }`);
        await context.server.player.play();
      }

      // if no url specified, disable the feature
      else{
        context.server.queue.disableMixPlaylist();

        await message.reply(`:white_check_mark:${t("commands:radio.stopped")}`).catch(this.logger.error);
      }
    }
    catch(er){
      await message.reply(t("errorOccurred"));
      this.logger.error(er);
    }
  }

  protected getVideoId(url: string){
    if(ytdl.validateURL(url)){
      return ytdl.getURLVideoID(url);
    }else{
      try{
        const urlObject = new URL(url);
        if(
          (urlObject.protocol === "http:" || urlObject.protocol === "https:")
          && urlObject.hostname === "www.youtube.com"
          && urlObject.pathname === "/playlist"
          && urlObject.searchParams.get("list")?.startsWith("RD")
        ){
          return urlObject.searchParams.get("list")!.substring(2);
        }
      }
      catch{
        /* empty */
      }
      return null;
    }
  }
}
