import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";
import type { ResponseMessage } from "../Component/ResponseMessage";
import type { SelectMenuOptions} from "eris";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import { bestdori, BestdoriApi } from "../AudioSource";
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class Searchb extends BaseCommand {
  constructor(){
    super({
      name: "searchb",
      alias: ["seb", "sb"],
      unlist: true,
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    options.JoinVoiceChannel(message);
    if(options.data[message.guild.id].SearchPanel !== null){
      message.reply("✘既に開かれている検索窓があります").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(options.rawArgs !== ""){
      let msg = null as ResponseMessage;
      let desc = "※最大20件まで表示されます\r\n\r\n";
      try{
        options.data[message.guild.id].SearchPanel = {} as any;
        msg = await message.reply("準備中...");
        options.data[message.guild.id].SearchPanel = {
          Msg: {
            id: msg.id,
            chId: msg.channel.id,
            userId: message.member.id,
            userName: Util.eris.user.getDisplayName(message.member),
            commandMessage: message
          },
          Opts: {}
        };
        await BestdoriApi.setupData();
        await msg.edit("🔍検索中...");
        const keys = Object.keys(bestdori.allsonginfo);
        const result = keys.filter(k => {
          const info = bestdori.allsonginfo[Number(k)];
          return (info.musicTitle[0] + bestdori.allbandinfo[info.bandId].bandName[0]).toLowerCase().includes(options.rawArgs.toLowerCase());
        });
        let index = 1;
        const selectOpts = [] as SelectMenuOptions[];
        for(let i = 0; i < result.length; i++){
          const title = bestdori.allsonginfo[Number(result[i])].musicTitle[0];
          desc += `\`${index}.\` [${bestdori.allsonginfo[Number(result[i])].musicTitle[0]}](${BestdoriApi.getAudioPage(Number(result[i]))}) - \`${bestdori.allbandinfo[bestdori.allsonginfo[Number(result[i])].bandId].bandName[0]}\` \r\n\r\n`;
          options.data[message.guild.id].SearchPanel.Opts[index] = {
            url: BestdoriApi.getAudioPage(Number(result[i])),
            title: title,
            duration: "0",
            thumbnail: BestdoriApi.getThumbnail(Number(result[i]), bestdori.allsonginfo[Number(result[i])].jacketImage[0])
          };
          selectOpts.push({
            label: index + ". " + (title.length > 90 ? title.substring(0, 90) + "…" : title),
            description: "長さ: " + options.data[message.guild.id].SearchPanel.Opts[index].duration + ", バンド名: " + bestdori.allbandinfo[bestdori.allsonginfo[Number(result[i])].bandId].bandName[0],
            value: index.toString()
          });
          index++;
          if(index >= 21){
            break;
          }
        }
        if(index === 1){
          options.data[message.guild.id].SearchPanel = null;
          await msg.edit(":pensive:見つかりませんでした。");
          return;
        }
        const embed = new Helper.MessageEmbedBuilder()
          .setColor(getColor("SEARCH"))
          .setTitle(`"${options.rawArgs}"の検索結果✨`)
          .setDescription(desc)
          .setFooter({
            icon_url: message.member.avatarURL,
            text: "楽曲のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
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
        Util.logger.log(e);
        options.data[message.guild.id].SearchPanel = null;
        if(msg) msg.edit("失敗しました").catch(er => Util.logger.log(er, "error"));
        else message.reply("失敗しました").catch(er => Util.logger.log(er, "error"));
      }
    }else{
      message.reply("引数を指定してください").catch(e => Util.logger.log(e, "error"));
    }
  }
}
