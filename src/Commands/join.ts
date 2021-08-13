import * as voice from "@discordjs/voice";
import { CommandArgs, CommandInterface } from ".";
import { log } from "../Util/util";
import { CommandMessage } from "../Component/CommandMessage"

export default class Join implements CommandInterface {
  name = "接続";
  alias = ["join", "参加", "connect"];
  description = "ボイスチャンネルに参加します。";
  unlist = false;
  category = "voice";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(message.member.voice.channel && message.member.voice.channel.members.has(options.client.user.id) && voice.getVoiceConnection(message.guild.id)){
      message.reply("✘すでにボイスチャンネルに接続中です。").catch(e => log(e, "error"));
    }else{
      options.Join(message, true);
    }
  }
}