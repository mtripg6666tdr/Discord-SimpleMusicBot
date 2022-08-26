import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Rewind extends BaseCommand {
  constructor(){
    super({
      name: "頭出し",
      alias: ["rewind", "gotop", "top"],
      description: "再生中の曲の頭出しを行います。",
      unlist: false,
      category: "player",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(!options.server.player.isPlaying){
      message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
    }else{
      options.server.player.rewind();
      message.reply(":rewind:再生中の楽曲を頭出ししました:+1:").catch(e => Util.logger.log(e, "error"));
    }
  }
}
