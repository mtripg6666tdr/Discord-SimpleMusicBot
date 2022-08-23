import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Loop extends BaseCommand {
  constructor(){
    super({
      name: "ループ",
      alias: ["トラックループ", "loop", "repeat", "trackloop", "trackrepeat"],
      description: "トラックごとのループを設定します。",
      unlist: false,
      category: "player",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.loopEnabled){
      options.data[message.guild.id].Queue.loopEnabled = false;
      message.reply(":repeat_one:トラックリピートを無効にしました:x:").catch(e => Util.logger.log(e, "error"));
    }else{
      options.data[message.guild.id].Queue.loopEnabled = true;
      message.reply(":repeat_one:トラックリピートを有効にしました:o:").catch(e => Util.logger.log(e, "error"));
    }
  }
}
