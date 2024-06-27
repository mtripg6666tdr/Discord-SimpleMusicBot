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

import { BaseCommand } from ".";
import { searchYouTube } from "../AudioSource";

export default class BulkPlay extends BaseCommand {
  constructor(){
    super({
      alias: ["bulk_play", "bulk-play", "bulkplay"],
      unlist: false,
      category: "player",
      args: [
        {
          type: "string",
          name: "keyword1",
          required: true,
        },
        {
          type: "string",
          name: "keyword2",
          required: true,
        },
        {
          type: "string",
          name: "keyword3",
          required: false,
        },
        {
          type: "string",
          name: "keyword4",
          required: false,
        },
        {
          type: "string",
          name: "keyword5",
          required: false,
        },
      ],
      requiredPermissionsOr: [],
      shouldDefer: true,
      usage: true,
      examples: true,
    });
  }

  @BaseCommand.updateBoundChannel
  protected async run(message: CommandMessage, context: Readonly<CommandArgs>): Promise<void> {
    if(!await context.server.joinVoiceChannel(message, { replyOnFail: true })) return;

    const { t } = context;

    if(context.args.length === 0){
      await message.reply(t("commands:play.noContent")).catch(this.logger.error);
      return;
    }

    const msg = await message.channel.createMessage({
      content: `🔍${t("search.searching")}...`,
    });

    const keywords = (
      await Promise.allSettled(
        context.args.map(async keyword => {
          if(keyword.startsWith("http://") || keyword.startsWith("https://")){
            return keyword;
          }

          let videos: ytsr.Video[] | dYtsr.Video[] = null!;

          if(context.bot.cache.hasSearch(keyword)){
            videos = await context.bot.cache.getSearch(keyword);
          }else{
            const result = await searchYouTube(keyword);
            videos = (result.items as (ytsr.Item | dYtsr.Video)[]).filter(it => it.type === "video") as (ytsr.Video[] | dYtsr.Video[]);
            context.bot.cache.addSearch(context.rawArgs, videos);
          }

          if(videos.length === 0){
            throw new Error("No result found.");
          }

          return videos[0].url;
        })
      )
    )
      .filter(res => res.status === "fulfilled")
      .map(res => res.value);

    if(keywords.length === 0){
      await Promise.allSettled([
        message.reply(t("commands:play.noContent")).catch(this.logger.error),
        msg.delete(),
      ]);
      return;
    }else if(keywords.length !== context.args.length){
      await msg.edit({
        content: t("commands:bulk_play.partialSuccess"),
      }).catch(this.logger.error);
    }

    await Promise.allSettled([
      context.server.playFromUrl(message, keywords, {}),
      msg.delete().catch(this.logger.error),
    ]);
  }
}
