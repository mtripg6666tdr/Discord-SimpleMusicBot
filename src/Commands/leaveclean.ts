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
    options.server.updateBoundChannel(message);
    if(!options.server.player.isConnecting){
      options.server.queue.removeAll();
      message.reply("✅すべて削除しました").catch(e => Util.logger.log(e, "error"));
      return;
    }else if(options.server.queue.length === 0){
      message.reply("キューが空です").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const members = (options.client.getChannel(options.server.connection.channelID) as VoiceChannel).voiceMembers.map(member => member.id);
    const number = options.server.queue.removeIf(q => !members.includes(q.AdditionalInfo.AddedBy.userId)).length;
    await message.reply(number >= 1 ? "✅" + number + "曲削除しました。" : "削除するものはありませんでした。").catch(e => Util.logger.log(e, "error"));
  }
}
