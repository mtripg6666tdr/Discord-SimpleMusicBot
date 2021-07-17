import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { log } from "../Util/util";

export default class Rmall implements CommandInterface {
  name = "すべて削除";
  alias = ["すべて削除", "rmall", "allrm", "removeall"];
  description = "キュー内の曲をすべて削除します。";
  unlist = false;
  category = "playlist";
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!message.member.voice.channel || (message.member.voice.channel && !message.member.voice.channel.members.has(options.client.user.id))){
      if(!message.member.hasPermission("MANAGE_GUILD") && !message.member.hasPermission("MANAGE_CHANNELS")){
        message.channel.send("この操作を実行する権限がありません。").catch(e => log(e, "error"));
        return;
      }
    }
    options.data[message.guild.id].Manager.Disconnect();
    options.data[message.guild.id].Queue.RemoveAll();
    message.channel.send("✅すべて削除しました").catch(e => log(e, "error"))
  }
}