import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Shuffle extends BaseCommand {
  constructor(){
    super({
      name: "シャッフル",
      alias: ["shuffle"],
      description: "キューの内容をシャッフルします。",
      unlist: false,
      category: "playlist",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.server.queue.length === 0){
      message.reply("キューが空です。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.queue.shuffle();
    message.reply(":twisted_rightwards_arrows:シャッフルしました✅").catch(e => Util.logger.log(e, "error"));
  }
}
