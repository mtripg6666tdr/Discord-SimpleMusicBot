/*
 * Copyright 2021-2025 mtripg6666tdr
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
import type { SongInfo } from "../Component/searchPanel";
import type { YouTubeSearchVideoItem } from "../AudioSource/youtube/ytdlCore";

import { MessageActionRowBuilder, MessageButtonBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand, getCommandExecutionContext } from ".";
import { searchYouTube } from "../AudioSource";
import { getConfig } from "../config";
import { DefaultAudioThumbnailURL } from "../definition";

export abstract class SearchBase<T> extends BaseCommand {
  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    // URLが渡されたら、そのままキューに追加を試みる
    if (this.urlCheck(context.rawArgs)) {
      const joinResult = await context.server.joinVoiceChannel(message, { replyOnFail: true });
      if (!joinResult) {
        return;
      }

      await context.server.playFromUrl(message, context.args as string[], { first: !context.server.player.isConnecting });
      return;
    }

    // ボイスチャンネルへの参加の試みをしておく
    context.server.joinVoiceChannel(message, {}).catch(this.logger.error);

    // 検索パネルがすでにあるなら
    if (context.server.searchPanel.has(message.member.id)) {
      const { collector, customIdMap } = context.bot.collectors
        .create()
        .setAuthorIdFilter(message.member.id)
        .setTimeout(1 * 60 * 1000)
        .createCustomIds({
          cancelSearch: "button",
        });

      const responseMessage = await message.reply({
        content: `✘${t("search.alreadyOpen")}`,
        components: [
          new MessageActionRowBuilder()
            .addComponents(
              new MessageButtonBuilder()
                .setCustomId(customIdMap.cancelSearch)
                .setLabel(t("search.removePreviousPanel"))
                .setStyle("DANGER"),
            )
            .toOceanic(),
        ],
      }).catch(this.logger.error);

      if (responseMessage) {
        const panel = context.server.searchPanel.get(message.member.id);
        if (!panel) return;

        collector.on("cancelSearch", interaction => {
          panel.destroy({ quiet: true }).catch(this.logger.error);
          interaction.createFollowup({
            content: `🚮${t("search.previousPanelRemoved")}:white_check_mark:`,
          }).catch(this.logger.error);
        });

        collector.setMessage(responseMessage);

        panel.once("destroy", () => collector.destroy());
      }
      return;
    }

    // 検索を実行する
    if (context.rawArgs !== "") {
      const searchPanel = context.server.searchPanel.create(message, context.rawArgs);
      if (!searchPanel) {
        return;
      }
      await searchPanel.consumeSearchResult(this.searchContent(context.rawArgs, context), this.consumer.bind(this));
    } else {
      await message.reply(t("commands:search.noArgument")).catch(this.logger.error);
    }
  }

  /**
   * 検索を実行する関数
   * 検索時にクエリーの変換を行う場合は、変換後のクエリをtransfomedQueryとして返す必要があります。
   */
  protected abstract searchContent(query: string, context: CommandArgs): Promise<T | { result: T, transformedQuery: string }>;

  /** 検索結果を検索パネルで使用できるデータに変換する関数 */
  protected abstract consumer(result: T): SongInfo[];

  /** この検索が対象とするURLかを判断する関数 */
  // eslint-disable-next-line unused-imports/no-unused-vars
  protected urlCheck(query: string) {
    return false;
  }
}

const config = getConfig();

export default class Search extends SearchBase<YouTubeSearchVideoItem[]> {
  constructor() {
    super({
      alias: ["search", "se"],
      unlist: false,
      category: "playlist",
      args: [{
        type: "string",
        name: "keyword",
        required: true,
      }],
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: true,
      disabled: config.isDisabledSource("youtube"),
      usage: true,
      examples: true,
    });
  }

  protected override async searchContent(query: string, context: CommandArgs) {
    return searchYouTube(query)
      .then(result => {
        const videos = (result.items as YouTubeSearchVideoItem[]).filter(item => item.type === "video");
        context.bot.cache.search.add(query, videos);
        return videos;
      });
  }

  protected override consumer(items: YouTubeSearchVideoItem[]) {
    const { t } = getCommandExecutionContext();

    return items.map(item => ({
      url: item.url,
      title: item.title,
      duration: item.duration || "0",
      thumbnail: item.bestThumbnail?.url || item.thumbnail || DefaultAudioThumbnailURL,
      author: item.author?.name || t("unknown"),
      description: `${t("length")}: ${item.duration}, ${t("channelName")}: ${item.author?.name || t("unknown")}`,
    })).filter(n => n);
  }

  protected override urlCheck(query: string) {
    return query.startsWith("http://") || query.startsWith("https://");
  }
}
