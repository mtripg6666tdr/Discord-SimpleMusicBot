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
import type { SongInfo } from "../Component/SearchPanel";
import type * as ytsr from "ytsr";

import { BaseCommand } from ".";
import { searchYouTube } from "../AudioSource";
import { Util } from "../Util";

export abstract class SearchBase<T> extends BaseCommand {
  async run(message:CommandMessage, options:CommandArgs){
    if(!Util.eris.user.isPrivileged(message.member) && options.server.player.isConnecting && !Util.eris.channel.sameVC(message.member, options)){
      message.reply("この操作を実行する権限がありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.updateBoundChannel(message);
    options.server.joinVoiceChannel(message);
    if(this.urlCheck(options.rawArgs)){
      await Promise.all(options.args.map(u => options.server.playFromURL(message, u, !options.server.player.isConnecting)));
      return;
    }
    if(options.server.getSearchPanel(message.member.id)){
      message.reply("✘既に開かれている検索窓があります").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(options.rawArgs !== ""){
      const searchPanel = options.server.createSearchPanel(message, options.rawArgs);
      if(!searchPanel) return;
      const result = await searchPanel.consumeSearchResult(this.searchContent(options.rawArgs), this.consumer);
      if(result){
        options.server.bindSearchPanel(searchPanel);
      }
    }else{
      await message.reply("引数を指定してください").catch(e => Util.logger.log(e, "error"));
    }
  }

  protected abstract searchContent(query:string):Promise<T|{result:T, transformedQuery:string}>;

  protected abstract consumer(result:T):SongInfo[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected urlCheck(query:string){
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
        required: true
      }],
      permissionDescription: "ボットがボイスチャンネルに接続中ならば、ボットがどのボイスチャンネルにも接続していない、またはユーザーと同じボイスチャンネルに接続していること。どこにも接続していなければ特に権限必要なし。",
    });
  }

  protected override searchContent(query:string){
    return searchYouTube(query);
  }

  protected override consumer({items}:ytsr.Result){
    return items.map(item => item.type !== "video" ? null : {
      url: item.url,
      title: item.title,
      duration: item.duration,
      thumbnail: item.bestThumbnail.url,
      author: item.author.name,
      description: `長さ: ${item.duration}, チャンネル名: ${item.author.name}`
    }).filter(n => n);
  }

  protected override urlCheck(query: string){
    return query.startsWith("http://") || query.startsWith("https://");
  }
}
