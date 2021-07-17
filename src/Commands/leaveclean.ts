import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { log } from "../Util/util";

export default class LeaveClean implements CommandInterface {
  name = "leaveclean";
  alias = ["lc"];
  description = "ボイスチャンネルから離脱した人のリクエストした曲を削除して整理します";
  unlist = false;
  category = "playlist";
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!options.data[message.guild.id].Manager.IsConnecting){
      options.data[message.guild.id].Queue.RemoveAll();
      message.channel.send("✅すべて削除しました").catch(e => log(e, "error"));
      return;
    }else if(options.data[message.guild.id].Queue.length === 0){
      message.channel.send("キューが空です").catch(e => log(e, "error"));
      return;
    }
    const members = ((await options.data[message.guild.id].Connection.channel.fetch()) as discord.VoiceChannel).members.array().map(m => m.id);
    const number = options.data[message.guild.id].Queue.RemoveIf(q => members.indexOf(q.AdditionalInfo.AddedBy.userId) < 0).length;
    message.channel.send(number >= 1 ? "✅" + number + "曲削除しました。" : "削除するものはありませんでした。").catch(e => log(e, "error"));;
  }
}