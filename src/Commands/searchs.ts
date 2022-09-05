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

import type { CommandArgs } from ".";
import type { SoundCloudTrackCollection } from "../AudioSource";
import type { CommandMessage } from "../Component/CommandMessage";
import type { ResponseMessage } from "../Component/ResponseMessage";
import type { Message, SelectMenuOptions, TextChannel } from "eris";
import type { SoundcloudTrackV2 } from "soundcloud.ts";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import Soundcloud from "soundcloud.ts";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";
import { DefaultUserAgent } from "../definition";

export default class Searchs extends BaseCommand {
  constructor(){
    super({
      name: "サウンドクラウドを検索",
      alias: ["soundcloudを検索", "searchs", "ses", "ss"],
      description: "曲をSoundCloudで検索します",
      unlist: false,
      category: "playlist",
      examples: "ses sakura trip",
      usage: "ses <キーワード>",
      argument: [{
        type: "string",
        name: "keyword",
        description: "検索したい楽曲のキーワードまたはURL。",
        required: true
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    options.server.joinVoiceChannel(message);
    if(options.server.searchPanel !== null){
      message.reply("✘既に開かれている検索窓があります").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(options.rawArgs !== ""){
      let msg = null as Message<TextChannel>|ResponseMessage;
      let desc = "";
      try{
        options.server.searchPanel = {} as any;
        msg = await message.reply("🔍検索中...");
        options.server.searchPanel = {
          Msg: {
            id: msg.id,
            chId: msg.channel.id,
            userId: message.member.id,
            userName: Util.eris.user.getDisplayName(message.member),
            commandMessage: message
          },
          Opts: {}
        };
        const soundcloud = new Soundcloud();
        let result:SoundcloudTrackV2[] = [];
        if(options.rawArgs.match(/^https:\/\/soundcloud.com\/[^/]+$/)){
          // ユーザーの楽曲検索
          const user = (await soundcloud.users.getV2(options.rawArgs));
          options.rawArgs = user.username;
          let nextUrl = "";
          let rawResult = (await soundcloud.api.getV2("users/" + user.id + "/tracks") as SoundCloudTrackCollection);
          result.push(...rawResult.collection);
          nextUrl = rawResult.next_href + "&client_id=" + await soundcloud.api.getClientID();
          while(nextUrl && result.length < 10){
            const data = await Util.web.DownloadText(nextUrl, {
              "User-Agent": DefaultUserAgent
            });
            rawResult = JSON.parse(data) as SoundCloudTrackCollection;
            result.push(...rawResult.collection);
            nextUrl = rawResult.next_href ? rawResult.next_href + "&client_id=" + await soundcloud.api.getClientID() : rawResult.next_href;
          }
        }else{
          // 楽曲検索
          result = (await soundcloud.tracks.searchV2({q: options.rawArgs})).collection;
        }
        if(result.length > 12) result = result.splice(0, 11);
        let index = 1;
        const selectOpts = [] as SelectMenuOptions[];
        for(let i = 0; i < result.length; i++){
          const [min, sec] = Util.time.CalcMinSec(Math.floor(result[i].duration / 1000));
          desc += `\`${index}.\` [${result[i].title}](${result[i].permalink_url}) ${min}:${sec} - [${result[i].user.username}](${result[i].user.permalink_url}) \r\n\r\n`;
          options.server.searchPanel.Opts[index] = {
            url: result[i].permalink_url,
            title: result[i].title,
            duration: result[i].full_duration.toString(),
            thumbnail: result[i].artwork_url
          };
          selectOpts.push({
            label: index + ". " + (result[i].title.length > 90 ? result[i].title.substr(0, 90) + "…" : result[i].title),
            description: "長さ: " + min + ":" + sec + ", ユーザー: " + result[i].user.username,
            value: index.toString()
          });
          index++;
        }
        if(index === 1){
          options.server.searchPanel = null;
          await msg.edit(":pensive:見つかりませんでした。");
          return;
        }
        const embed = new Helper.MessageEmbedBuilder()
          .setColor(getColor("SEARCH"))
          .setTitle("\"" + options.rawArgs + "\"の検索結果✨")
          .setDescription(desc)
          .setFooter({
            icon_url: message.member.avatarURL,
            text: "楽曲のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。",
          })
          .toEris()
        ;
        await msg.edit({
          content: "",
          embeds: [embed],
          components: [
            new Helper.MessageActionRowBuilder()
              .addComponents(
                new Helper.MessageSelectMenuBuilder()
                  .setCustomId("search")
                  .setPlaceholder("数字を送信するか、ここから選択...")
                  .setMinValues(1)
                  .setMaxValues(index - 1)
                  .addOptions(...selectOpts, {
                    label: "キャンセル",
                    value: "cancel"
                  })
              )
              .toEris()
          ]
        });
      }
      catch(e){
        Util.logger.log(e, "error");
        options.server.searchPanel = null;
        if(msg) msg.edit("✘内部エラーが発生しました").catch(er => Util.logger.log(er, "error"));
        else message.reply("✘内部エラーが発生しました").catch(er => Util.logger.log(er, "error"));
      }
    }else{
      await message.reply("引数を指定してください").catch(e => Util.logger.log(e, "error"));
    }
  }
}
