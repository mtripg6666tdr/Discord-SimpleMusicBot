/*
 * Copyright 2021-2022 mtripg6666tdr
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
import type { SelectMenuOptions } from "eris";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import Util from "../Util";
import { getColor } from "../Util/color";

type status = "init"|"consumed"|"destroyed";

export class SearchPanel {
  protected status:status = "init";
  protected _options:SongInfo[] = null;
  get options():Readonly<SongInfo[]>{
    return this._options;
  }

  get commandMessage(){
    return this._commandMessage;
  }

  protected _responseMessage:ResponseMessage = null;

  get responseMesasge(){
    return this._responseMessage;
  }

  constructor(protected readonly _commandMessage:CommandMessage, protected readonly query:string){
    if(!_commandMessage || !query){
      throw new Error("Invalid arguments passed");
    }
  }

  async consumeSearchResult<T>(searchPromise:Promise<T>, consumer:(result:T) => SongInfo[]){
    if(this.status !== "init") return false;
    this.status = "consumed";
    let reply:ResponseMessage = null;
    try{
      reply = await this._commandMessage.reply("🔍検索中...");
      const songResult = consumer(await searchPromise);
      if(songResult.length <= 0){
        await reply.edit(":pensive:見つかりませんでした。");
        return false;
      }
      let searchPanelDescription = "";
      const selectOpts:SelectMenuOptions[] = songResult.map(({url, title, author, duration, description}, j) => {
        searchPanelDescription += `\`${j}.\` [${title}](${url}) \`${duration}\` - \`${author}\` \r\n\r\n`;
        return {
          label: `${(j + 1).toString()}. ${(title.length > 90 ? title.substring(0, 90) + "…" : title)}`,
          description,
          value: (j + 1).toString()
        };
      });
      this._responseMessage = await reply.edit({
        content: "",
        embeds: [
          new Helper.MessageEmbedBuilder()
            .setTitle(`"${this.query}"の検索結果✨`)
            .setColor(getColor("SEARCH"))
            .setDescription(searchPanelDescription)
            .setFooter({
              icon_url: this._commandMessage.member.avatarURL,
              text: "再生したい項目を選択して数字を送信するか、下から選択してください。キャンセルするにはキャンセルまたはcancelと入力します。また、サムネイルコマンドを使用してサムネイルを確認できます。",
            })
            .toEris(),
        ],
        components: [
          new Helper.MessageActionRowBuilder()
            .addComponents(
              new Helper.MessageSelectMenuBuilder()
                .setCustomId("search")
                .setPlaceholder("数字を選択するか、ここから選択...")
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
            .toEris(),
        ]
      });
      return true;
    }
    catch(e){
      Util.logger.log(e, "error");
      if(reply){
        reply.edit("✘内部エラーが発生しました").catch(er => Util.logger.log(er, "error"));
      }else{
        this._commandMessage.reply("✘内部エラーが発生しました").catch(er => Util.logger.log(er, "error"));
      }
      return false;
    }
  }

  filterOnlyIncludes(nums:number[]){
    // eslint-disable-next-line yoda
    return nums.filter(n => 0 < n && n <= this._options.length);
  }

  decideItems(nums:number[]){
    return {
      urls: nums.map(n => this._options[n].url),
      responseMessage: this._responseMessage,
    };
  }

  async destroy(){
    if(this.status !== "consumed") return;
    await this._responseMessage.channel.createMessage("✅キャンセルしました");
    await this._responseMessage.delete();
  }
}

type SongInfo = {
  url:string,
  title:string,
  author:string,
  duration:string,
  thumbnail:string,
  description:string,
};
