import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { bestdori, BestdoriApi } from "../AudioSource/bestdori";
import { CommandMessage } from "../Component/CommandMessage"
import { getColor } from "../Util/colorUtil";
import { log } from "../Util/util";

export default class Searchb implements CommandInterface {
  name = "searchb";
  alias = ["seb", "sb"];
  unlist = true;
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    options.Join(message);
    if(options.data[message.guild.id].SearchPanel !== null){
      message.channel.send("✘既に開かれている検索窓があります").catch(e => log(e, "error"));
      return;
    }
    if(options.rawArgs !== ""){
      let msg = null as discord.Message;
      let desc = "※最大20件まで表示されます\r\n\r\n";
      try{
        options.data[message.guild.id].SearchPanel = {} as any;
        const msg = await message.channel.send("準備中...");
        options.data[message.guild.id].SearchPanel = {
          Msg: {
            id: msg.id,
            chId: msg.channel.id,
            userId: message.author.id,
            userName: message.member.displayName
          },
          Opts: {}
        };
        await BestdoriApi.setupData();
        await msg.edit("🔍検索中...");
        const keys = Object.keys(bestdori.allsonginfo);
        const result = keys.filter(k => {
          const info = bestdori.allsonginfo[Number(k)];
          return (info.musicTitle[0] + bestdori.allbandinfo[info.bandId].bandName[0]).toLowerCase().indexOf(options.rawArgs.toLowerCase()) >= 0
        });
        const embed = new discord.MessageEmbed();
        embed.setColor(getColor("SEARCH"));
        embed.title = "\"" + options.rawArgs + "\"の検索結果✨"
        let index = 1;
        for(let i = 0; i < result.length; i++){
          desc += "`" + index + ".` [" + bestdori.allsonginfo[Number(result[i])].musicTitle[0] + "](" + BestdoriApi.getAudioPage(Number(result[i])) + ") - `" + bestdori.allbandinfo[bestdori.allsonginfo[Number(result[i])].bandId].bandName[0] + "` \r\n\r\n";
          options.data[message.guild.id].SearchPanel.Opts[index] = {
            url: BestdoriApi.getAudioPage(Number(result[i])),
            title: bestdori.allsonginfo[Number(result[i])].musicTitle[0],
            duration: "0",
            thumbnail: BestdoriApi.getThumbnail(Number(result[i]), bestdori.allsonginfo[Number(result[i])].jacketImage[0])
          };
          index++;
          if(index>=21){
            break;
          }
        }
        if(index === 1){
          options.data[message.guild.id].SearchPanel = null;
          await msg.edit(":pensive:見つかりませんでした。");
          return;
        }
        embed.description = desc;
        embed.footer = {
          iconURL: message.author.avatarURL(),
          text:"楽曲のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
        };
        await msg.edit({embeds:[embed]});
      }
      catch(e){
        console.log(e)
        if(msg) msg.edit("失敗しました").catch(e => log(e, "error"));
        else message.channel.send("失敗しました").catch(e => log(e, "error"));
      }
    }else{
      message.channel.send("引数を指定してください").catch(e => log(e, "error"));
    }
  }
}