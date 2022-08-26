import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Loop extends BaseCommand {
  constructor(){
    super({
      name: "ループ",
      alias: ["トラックループ", "loop", "repeat", "lp", "trackloop", "trackrepeat"],
      description: "トラックごとのループを設定します。",
      unlist: false,
      category: "player",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.server.queue.loopEnabled){
      options.server.queue.loopEnabled = false;
      message.reply(":repeat_one:トラックリピートを無効にしました:x:").catch(e => Util.logger.log(e, "error"));
    }else{
      options.server.queue.loopEnabled = true;
      message.reply(":repeat_one:トラックリピートを有効にしました:o:").catch(e => Util.logger.log(e, "error"));
    }
  }
}
