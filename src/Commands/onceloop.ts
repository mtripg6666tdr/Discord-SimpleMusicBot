import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class OnceLoop extends BaseCommand {
  constructor(){
    super({
      name: "ワンスループ",
      alias: ["onceloop", "looponce"],
      description: "現在再生中の再生が終了後、もう一度だけ同じ曲をループ再生します。",
      unlist: false,
      category: "player",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.server.queue.onceLoopEnabled){
      options.server.queue.onceLoopEnabled = false;
      message.reply(":repeat_one:ワンスループを無効にしました:x:").catch(e => Util.logger.log(e, "error"));
    }else{
      options.server.queue.onceLoopEnabled = true;
      message.reply(":repeat_one:ワンスループを有効にしました:o:").catch(e => Util.logger.log(e, "error"));
    }
  }
}
