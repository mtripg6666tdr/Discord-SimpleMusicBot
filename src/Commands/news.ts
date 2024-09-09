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

import { MessageActionRowBuilder, MessageButtonBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import { Playlist } from "../AudioSource/youtube/playlist";
import { getConfig } from "../config";
import { DefaultAudioThumbnailURL } from "../definition";

const config = getConfig();

export default class News extends BaseCommand {
  constructor() {
    super({
      alias: ["news"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: true,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    context.server.joinVoiceChannel(message, {}).catch(this.logger.error);
    // change news according to locale
    let url: string = null!;
    switch (context.locale) {
      case "en-US":
        url = Buffer.from(
          "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTDNaUTVDcE51bFFsZE9MM1Q4ZzhrMW1nV1d5c0pmRTl3",
          "base64"
        ).toString();
        break;
      case "en-GB":
        url = Buffer.from(
          "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTDNaUTVDcE51bFFrMHkyTHVfdEs4Vkx4d29KTkNoaG45v",
          "base64"
        ).toString();
        break;
      case "fr":
        url = Buffer.from(
          "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTDNaUTVDcE51bFFsYUtKcHktTmVHUFBWemJvZVNseW13",
          "base64"
        ).toString();
        break;
      case "th":
        url = Buffer.from(
          "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTDNaUTVDcE51bFFtN2dIOGNtaVB5Z3kyT3llOE9nak1a",
          "base64"
        ).toString();
        break;
      case "zh-TW":
        url = Buffer.from(
          "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTDNaUTVDcE51bFFrRXhUeGp6bEo4ekRvX1VfMXVNS0p1",
          "base64"
        ).toString();
        break;
      default:
        url = Buffer.from(
          "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTDNaUTVDcE51bFFrOC1wMENXbzl1Zkk4MUlkckdveU5a",
          "base64"
        ).toString();
    }
    if (context.server.searchPanel.has(message.member.id)) {
      const { collector, customIdMap } = context.bot.collectors
        .create()
        .setAuthorIdFilter(message.member.id)
        .setTimeout(1 * 60 * 1000)
        .createCustomIds({
          cancelSearch: "button",
        });

      const responseMessage = await message.reply({
        content: t("search.alreadyOpen"),
        components: [
          new MessageActionRowBuilder()
            .addComponents(
              new MessageButtonBuilder()
                .setCustomId(customIdMap.cancelSearch)
                .setLabel(t("search.removePreviousPanel"))
                .setStyle("DANGER")
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
    const searchPanel = context.server.searchPanel.create(message, t("commands:news.newsTopics"), true);
    if (!searchPanel) return;
    await searchPanel.consumeSearchResult(
      Playlist(url, {
        gl: config.country,
        hl: context.locale,
        limit: 20,
      }),
      ({ items }) => items.map(item => ({
        ...item,
        thumbnail: item.thumbnail || DefaultAudioThumbnailURL,
        duration: item.durationText,
        description: `${t("length")}: ${item.duration}, ${t("channelName")}: ${item.author}`,
      })),
    );
  }
}
