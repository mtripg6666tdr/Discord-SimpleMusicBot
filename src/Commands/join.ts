import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { log } from "../Util/util";

export default class Join implements CommandInterface {
  name = "join";
  alias = ["参加", "接続", "connect"];
  description = "ボイスチャンネルに参加します。";
  unlist = false;
  category = "voice";
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    if(message.member.voice.channel && message.member.voice.channel.members.has(options.client.user.id) && options.data[message.guild.id].Connection){
      message.channel.send("✘すでにボイスチャンネルに接続中です。").catch(e => log(e, "error"));
    }else{
      options.Join(message);
    }
  }
}