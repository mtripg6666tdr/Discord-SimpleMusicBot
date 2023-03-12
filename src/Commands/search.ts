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
import type { SongInfo } from "../Component/SearchPanel";
import type { CommandMessage } from "../Component/commandResolver/CommandMessage";
import type * as ytsr from "ytsr";

import { MessageActionRowBuilder, MessageButtonBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import { searchYouTube } from "../AudioSource";

export abstract class SearchBase<T> extends BaseCommand {
  async run(message: CommandMessage, context: CommandArgs){
    context.server.updateBoundChannel(message);

    // ボイスチャンネルへの参加の試みをしておく
    context.server.joinVoiceChannel(message);

    // URLが渡されたら、そのままキューに追加を試みる
    if(this.urlCheck(context.rawArgs)){
      await context.server.playFromURL(message, context.args as string[], !context.server.player.isConnecting);
      return;
    }

    // 検索パネルがすでにあるなら
    if(context.server.searchPanel.has(message.member.id)){
      const { collector, customIdMap } = context.bot.collectors
        .create()
        .setAuthorIdFilter(message.member.id)
        .setTimeout(1 * 60 * 1000)
        .createCustomIds({
          cancelSearch: "button",
        });
      const responseMessage = await message.reply({
        content: "✘既に開かれている検索窓があります",
        components: [
          new MessageActionRowBuilder()
            .addComponents(
              new MessageButtonBuilder()
                .setCustomId(customIdMap.cancelSearch)
                .setLabel("以前の検索結果を破棄")
                .setStyle("DANGER")
            )
            .toOceanic(),
        ],
      }).catch(this.logger.error);
      if(responseMessage){
        const panel = context.server.searchPanel.get(message.member.id);
        collector.on("cancelSearch", interaction => {
          panel.destroy({ quiet: true });
          interaction.createFollowup({
            content: "🚮検索パネルを破棄しました:white_check_mark:",
          }).catch(this.logger.error);
        });
        collector.setMessage(responseMessage);
        panel.once("destroy", () => collector.destroy());
      }
      return;
    }

    // 検索を実行する
    if(context.rawArgs !== ""){
      const searchPanel = context.server.searchPanel.create(message, context.rawArgs);
      if(!searchPanel){
        return;
      }
      await searchPanel.consumeSearchResult(this.searchContent(context.rawArgs), this.consumer);
    }else{
      await message.reply("引数を指定してください").catch(this.logger.error);
    }
  }

  /** 検索を実行する関数 */
  protected abstract searchContent(query: string): Promise<T|{ result: T, transformedQuery: string }>;

  /** 検索結果を検索パネルで使用できるデータに変換する関数 */
  protected abstract consumer(result: T): SongInfo[];

  /** この検索が対象とするURLかを判断する関数 */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected urlCheck(query: string){
    return false;
  }
}

export default class Search extends SearchBase<ytsr.Result> {
  constructor(){
    super({
      name: "検索",
      alias: ["search", "se"],
      description: "曲をYouTubeで検索します。直接URLを直接指定することもできます。",
      unlist: false,
      category: "playlist",
      examples: "検索 夜に駆ける",
      usage: "検索 <キーワード>",
      argument: [{
        type: "string",
        name: "keyword",
        description: "検索したい動画のキーワードまたはURL。",
        required: true,
      }],
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: true,
    });
  }

  protected override searchContent(query: string){
    return searchYouTube(query);
  }

  protected override consumer({ items }: ytsr.Result){
    return items.map(item => item.type !== "video" ? null : {
      url: item.url,
      title: item.title,
      duration: item.duration,
      thumbnail: item.bestThumbnail.url,
      author: item.author.name,
      description: `長さ: ${item.duration}, チャンネル名: ${item.author.name}`,
    }).filter(n => n);
  }

  protected override urlCheck(query: string){
    return query.startsWith("http://") || query.startsWith("https://");
  }
}
