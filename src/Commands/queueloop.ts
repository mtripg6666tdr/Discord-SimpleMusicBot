import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class QueueLoop extends BaseCommand {
  constructor(){
    super({
      name: "キューループ",
      alias: ["queueloop", "loopqueue"],
      description: "キュー内のループを設定します。",
      unlist: false,
      category: "player",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.queueLoopEnabled){
      options.data[message.guild.id].Queue.queueLoopEnabled = false;
      message.reply(":repeat:キューリピートを無効にしました:x:").catch(e => Util.logger.log(e, "error"));
    }else{
      options.data[message.guild.id].Queue.queueLoopEnabled = true;
      message.reply(":repeat:キューリピートを有効にしました:o:").catch(e => Util.logger.log(e, "error"));
    }
  }
}
