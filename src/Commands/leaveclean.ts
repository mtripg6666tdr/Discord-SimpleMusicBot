import * as discord from "discord.js";
import * as voice from "@discordjs/voice";
import { CommandArgs, CommandInterface } from ".";
import { log } from "../Util/util";
import { CommandLike } from "../Component/CommandLike";

export default class LeaveClean implements CommandInterface {
  name = "leaveclean";
  alias = ["lc"];
  description = "ボイスチャンネルから離脱した人がリクエストした曲をキューから削除して整理します";
  unlist = false;
  category = "playlist";
  async run(message:CommandLike, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!options.data[message.guild.id].Manager.IsConnecting){
      options.data[message.guild.id].Queue.RemoveAll();
      message.channel.send("✅すべて削除しました").catch(e => log(e, "error"));
      return;
    }else if(options.data[message.guild.id].Queue.length === 0){
      message.channel.send("キューが空です").catch(e => log(e, "error"));
      return;
    }
    const members = [...((await options.client.channels.resolve(voice.getVoiceConnection(message.guild.id).joinConfig.channelId).fetch()) as discord.VoiceChannel).members.keys()];
    const number = options.data[message.guild.id].Queue.RemoveIf(q => members.indexOf(q.AdditionalInfo.AddedBy.userId) < 0).length;
    message.channel.send(number >= 1 ? "✅" + number + "曲削除しました。" : "削除するものはありませんでした。").catch(e => log(e, "error"));;
  }
}