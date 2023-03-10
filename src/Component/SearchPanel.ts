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

import type { CommandMessage } from "./CommandMessage";
import type { ResponseMessage } from "./ResponseMessage";
import type { SelectOption } from "oceanic.js";

import { MessageActionRowBuilder, MessageEmbedBuilder, MessageStringSelectMenuBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { LogEmitter } from "../Structure";
import { getColor } from "../Util/color";
import { useConfig } from "../config";

type status = "init"|"consumed"|"destroyed";

interface SearchPanelEvents {
  destroy: [];
  open: [reply: ResponseMessage];
}

const config = useConfig();

export class SearchPanel extends LogEmitter<SearchPanelEvents> {
  protected _status: status = "init";
  protected get status(){
    return this._status;
  }
  protected set status(val: status){
    this._status = val;
    if(val === "destroyed") this.emit("destroy");
  }

  protected _options: SongInfo[] = null;
  get options(): Readonly<SongInfo[]>{
    return this._options;
  }

  get commandMessage(){
    return this._commandMessage;
  }

  protected _responseMessage: ResponseMessage = null;

  get responseMesasge(){
    return this._responseMessage;
  }

  constructor(protected readonly _commandMessage: CommandMessage, protected query: string, protected readonly isRawTitle: boolean = false){
    super("SearchPanel");
    if(!_commandMessage){
      throw new Error("Invalid arguments passed");
    }
  }

  async consumeSearchResult<T>(searchPromise: Promise<T|{ result: T, transformedQuery: string }>, consumer: (result: T) => SongInfo[]){
    if(this.status !== "init") return false;
    this.status = "consumed";
    let reply: ResponseMessage = null;
    try{
      reply = await this._commandMessage.reply("🔍検索中...");
      const waitedPromiseResult = await searchPromise;
      if("transformedQuery" in (waitedPromiseResult as { result: T, transformedQuery: string })) this.query = (waitedPromiseResult as { result: T, transformedQuery: string }).transformedQuery;
      const songResult = this._options = consumer("transformedQuery" in (waitedPromiseResult as { result: T, transformedQuery: string }) ? (waitedPromiseResult as { result: T, transformedQuery: string }).result : waitedPromiseResult as T).slice(0, 20);
      if(songResult.length <= 0){
        await reply.edit(":pensive:見つかりませんでした。");
        return false;
      }
      let searchPanelDescription = "";
      const selectOpts: SelectOption[] = songResult.map(({ url, title, author, duration, description }, j) => {
        searchPanelDescription += `\`${j + 1}.\` [${title}](${url}) \`${duration}\` - \`${author}\` \r\n\r\n`;
        return {
          label: `${(j + 1).toString()}. ${title.length > 90 ? title.substring(0, 90) + "…" : title}`,
          description,
          value: (j + 1).toString(),
        };
      });
      this._responseMessage = await reply.edit({
        content: "",
        embeds: [
          new MessageEmbedBuilder()
            .setTitle(this.isRawTitle ? this.query : `"${this.query}"の検索結果✨`)
            .setColor(getColor("SEARCH"))
            .setDescription(searchPanelDescription)
            .setFooter({
              iconURL: this._commandMessage.member.avatarURL(),
              text:
                config.noMessageContent
                  ? "再生したい項目を選択して数字を送信するか、下から選択してください。キャンセルするには「キャンセル」または「cancel」と選択/入力します。また、サムネイルコマンドを使用してサムネイルを確認できます。"
                  : "再生したい項目を、下から選択してください。キャンセルするには、下から\"キャンセル\"を選択してください。また、サムネイルコマンドを使用してサムネイルを確認することもできます。"
              ,
            })
            .toOceanic(),
        ],
        components: [
          new MessageActionRowBuilder()
            .addComponents(
              new MessageStringSelectMenuBuilder()
                .setCustomId("search")
                .setPlaceholder(
                  config.noMessageContent
                    ? "ここから選択..."
                    : "数字を直接送信するか、ここから選択..."
                )
                .setMinValues(1)
                .setMaxValues(songResult.length - 1)
                .addOptions(
                  ...selectOpts,
                  {
                    label: "キャンセル",
                    value: "cancel",
                  }
                )
            )
            .toOceanic(),
        ],
      });
      this.emit("open", this._responseMessage);
      return true;
    }
    catch(e){
      this.logger.error(e);
      if(reply){
        reply.edit("✘内部エラーが発生しました")
          .catch(this.logger.error);
      }else{
        this._commandMessage.reply("✘内部エラーが発生しました")
          .catch(this.logger.error);
      }
      return false;
    }
  }

  filterOnlyIncludes(nums: number[]){
    return nums.filter(n => 0 < n && n <= this._options.length);
  }

  decideItems(nums: number[]){
    this.status = "destroyed";
    return {
      urls: nums.map(n => this._options[n - 1].url),
      responseMessage: this._responseMessage,
    };
  }

  async destroy(option?: { quiet: boolean }){
    const quiet = option.quiet || false;
    if(this.status !== "consumed") return;
    if(!quiet){
      await this._responseMessage.channel.createMessage({
        content: "✅キャンセルしました",
      }).catch(this.logger.error);
    }
    await this._responseMessage.delete().catch(this.logger.error);
    this.status = "destroyed";
  }
}

export type SongInfo = {
  url: string,
  title: string,
  author: string,
  duration: string,
  thumbnail: string,
  description: string,
};
