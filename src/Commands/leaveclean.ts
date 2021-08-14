import * as discord from "discord.js";
import * as voice from "@discordjs/voice";
import { CommandArgs, CommandInterface } from ".";
import { log } from "../Util";
import { CommandMessage } from "../Component/CommandMessage"

export default class LeaveClean implements CommandInterface {
  name = "leaveclean";
  alias = ["lc"];
  description = "ボイスチャンネルから離脱した人がリクエストした曲をキューから削除して整理します";
  unlist = false;
  category = "playlist";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!options.data[message.guild.id].Manager.IsConnecting){
      options.data[message.guild.id].Queue.RemoveAll();
      message.reply("✅すべて削除しました").catch(e => log(e, "error"));
      return;
    }else if(options.data[message.guild.id].Queue.length === 0){
      message.reply("キューが空です").catch(e => log(e, "error"));
      return;
    }
    const members = [...((await options.client.channels.resolve(voice.getVoiceConnection(message.guild.id).joinConfig.channelId).fetch()) as discord.VoiceChannel).members.keys()];
    const number = options.data[message.guild.id].Queue.RemoveIf(q => members.indexOf(q.AdditionalInfo.AddedBy.userId) < 0).length;
    message.reply(number >= 1 ? "✅" + number + "曲削除しました。" : "削除するものはありませんでした。").catch(e => log(e, "error"));;
  }
}