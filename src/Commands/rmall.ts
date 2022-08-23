import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";
import type { VoiceChannel } from "eris";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Rmall extends BaseCommand {
  constructor(){
    super({
      name: "すべて削除",
      alias: ["すべて削除", "rmall", "allrm", "removeall"],
      description: "キュー内の曲をすべて削除します。\r\n※接続中の場合ボイスチャンネルから離脱します。",
      unlist: false,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!message.member.voiceState.channelID || ((options.client.getChannel(message.member.voiceState.channelID) as VoiceChannel).voiceMembers.has(options.client.user.id))){
      if(!message.member.permissions.has("manageGuild") && !message.member.permissions.has("manageChannels")){
        message.reply("この操作を実行する権限がありません。").catch(e => Util.logger.log(e, "error"));
        return;
      }
    }
    options.data[message.guild.id].Player.disconnect();
    options.data[message.guild.id].Queue.removeAll();
    await message.reply("✅すべて削除しました").catch(e => Util.logger.log(e, "error"));
  }
}
