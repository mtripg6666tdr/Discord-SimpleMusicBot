import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";
import type { SelectMenuOptions } from "eris";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import * as ytpl from "ytpl";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class Bgm extends BaseCommand {
  constructor(){
    super({
      name: "bgm",
      alias: ["study"],
      description: "開発者が勝手に作った勉強用・作業用BGMのプリセットプレイリストを表示し、聞きたいものを選択して再生することができます。",
      unlist: false,
      category: "playlist",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(!(await options.server.joinVoiceChannel(message, /* reply */ false, /* reply when failed */ true))) return;
    const url = "https://www.youtube.com/playlist?list=PLLffhcApso9xIBMYq55izkFpxS3qi9hQK";
    if(options.server.searchPanel !== null){
      message.reply("✘既に開かれている検索窓があります").catch(e => Util.logger.log(e, "error"));
      return;
    }
    try{
      const reply = await message.reply("🔍確認中...");
      options.server.searchPanel = {
        Msg: {
          chId: message.channel.id,
          id: reply.id,
          userId: message.member.id,
          userName: Util.eris.user.getDisplayName(message.member),
          commandMessage: message
        },
        Opts: {}
      };
      const {items: result} = await ytpl.default(url, {
        gl: "JP", hl: "ja"
      });
      let desc = "";
      const selectOpts = [] as SelectMenuOptions[];
      for(let i = 0; i < result.length; i++){
        const vid = result[i];
        desc += `\`${i + 1}.\` [${vid.title}](${vid.url}) \`${vid.duration}\` - \`${vid.author.name}\` \r\n\r\n`;
        options.server.searchPanel.Opts[i + 1] = {
          title: vid.title,
          url: vid.url,
          duration: vid.duration,
          thumbnail: vid.thumbnails[0].url
        };
        selectOpts.push({
          label: `${i + 1}. ${vid.title.length > 90 ? vid.title.substring(0, 90) : vid.title}`,
          description: `長さ: ${vid.duration}, チャンネル名: ${vid.author.name}`,
          value: (i + 1).toString()
        });
      }
      const embed = new Helper.MessageEmbedBuilder()
        .setTitle("プリセットBGM一覧")
        .setDescription(desc)
        .setColor(getColor("SEARCH"))
        .setFooter({
          icon_url: message.member.avatarURL,
          text: "動画のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
        })
      ;
      await reply.edit({
        content: "",
        embeds: [embed.toEris()],
        components: [
          new Helper.MessageActionRowBuilder()
            .addComponents(
              new Helper.MessageSelectMenuBuilder()
                .setCustomId("search")
                .setPlaceholder("数字を送信するか、ここから選択...")
                .setMinValues(1)
                .setMaxValues(result.length)
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
      Util.logger.log(JSON.stringify(e), "error");
      await message.reply(":cry:エラーが発生しました").catch(er => Util.logger.log(er, "error"));
    }
  }
}
