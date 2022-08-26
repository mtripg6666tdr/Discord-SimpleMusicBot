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
    options.server.updateBoundChannel(message);
    if(options.server.queue.queueLoopEnabled){
      options.server.queue.queueLoopEnabled = false;
      message.reply(":repeat:キューリピートを無効にしました:x:").catch(e => Util.logger.log(e, "error"));
    }else{
      options.server.queue.queueLoopEnabled = true;
      message.reply(":repeat:キューリピートを有効にしました:o:").catch(e => Util.logger.log(e, "error"));
    }
  }
}
