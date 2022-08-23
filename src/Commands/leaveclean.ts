import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";
import type { VoiceChannel } from "eris";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class LeaveClean extends BaseCommand {
  constructor(){
    super({
      name: "leaveclean",
      alias: ["lc"],
      description: "ボイスチャンネルから離脱した人がリクエストした曲をキューから削除して整理します",
      unlist: false,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!options.data[message.guild.id].Player.isConnecting){
      options.data[message.guild.id].Queue.removeAll();
      message.reply("✅すべて削除しました").catch(e => Util.logger.log(e, "error"));
      return;
    }else if(options.data[message.guild.id].Queue.length === 0){
      message.reply("キューが空です").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const members = (options.client.getChannel(options.data[message.guild.id].Connection.channelID) as VoiceChannel).voiceMembers.map(member => member.id);
    const number = options.data[message.guild.id].Queue.removeIf(q => !members.includes(q.AdditionalInfo.AddedBy.userId)).length;
    await message.reply(number >= 1 ? "✅" + number + "曲削除しました。" : "削除するものはありませんでした。").catch(e => Util.logger.log(e, "error"));
  }
}
