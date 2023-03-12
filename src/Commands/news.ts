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

import * as ytpl from "ytpl";

import { BaseCommand } from ".";

export default class News extends BaseCommand {
  constructor(){
    super({
      alias: ["news"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
      shouldDefer: true,
    });
  }

  async run(message: CommandMessage, context: CommandArgs){
    context.server.updateBoundChannel(message);
    context.server.joinVoiceChannel(message);
    const url = Buffer.from(
      "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTDNaUTVDcE51bFFrOC1wMENXbzl1Zkk4MUlkckdveU5a",
      "base64"
    ).toString();
    if(context.server.searchPanel.has(message.member.id)){
      message.reply("✘既に開かれている検索窓があります").catch(this.logger.error);
      return;
    }
    const searchPanel = context.server.searchPanel.create(message, "ニューストピックス", true);
    if(!searchPanel) return;
    await searchPanel.consumeSearchResult(ytpl.default(url, {
      gl: "JP", hl: "ja", limit: 20,
    }), ({ items }) => items.map(item => ({
      title: item.title,
      author: item.author.name,
      description: `長さ: ${item.duration}, チャンネル名: ${item.author.name}`,
      duration: item.duration,
      thumbnail: item.thumbnails[0].url,
      url: item.url,
    })));
  }
}
