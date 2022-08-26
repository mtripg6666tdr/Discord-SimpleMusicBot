import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class End extends BaseCommand {
  constructor(){
    super({
      name: "この曲で終了",
      alias: ["end"],
      description: "現在再生中の曲(再生待ちの曲)をのぞいてほかの曲をすべて削除します",
      unlist: false,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(!options.server.player.isPlaying){
      message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(options.server.queue.length <= 1){
      message.reply("キューが空、もしくは一曲しかないため削除されませんでした。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.queue.RemoveFrom2nd();
    options.server.queue.queueLoopEnabled = options.server.queue.onceLoopEnabled = options.server.queue.loopEnabled = false;
    message.reply("✅キューに残された曲を削除しました").catch(e => Util.logger.log(e, "error"));
  }
}
