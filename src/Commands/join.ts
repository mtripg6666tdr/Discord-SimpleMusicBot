import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";
import type { VoiceChannel } from "eris";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Join extends BaseCommand {
  constructor(){
    super({
      name: "接続",
      alias: ["join", "参加", "connect"],
      description: "ボイスチャンネルに参加します",
      unlist: false,
      category: "voice",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(message.member.voiceState.channelID && (options.client.getChannel(message.member.voiceState.channelID) as VoiceChannel).voiceMembers.has(options.client.user.id) && options.data[message.guild.id].Connection){
      message.reply("✘すでにボイスチャンネルに接続中です。").catch(e => Util.logger.log(e, "error"));
    }else{
      await options.JoinVoiceChannel(message, /* reply result to user inside this method  */ true);
    }
  }
}
