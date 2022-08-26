import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Mltf extends BaseCommand {
  constructor(){
    super({
      name: "最後の曲を先頭へ",
      alias: ["movelastsongtofirst", "mlstf", "ml", "mltf", "mlf", "m1"],
      description: "キューの最後の曲をキューの先頭に移動します。",
      unlist: false,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.server.queue.length <= 2){
      message.reply("キューに3曲以上追加されているときに使用できます。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const q = options.server.queue;
    const to = options.server.player.isPlaying ? 1 : 0;
    q.move(q.length - 1, to);
    const info = q.get(to);
    message.reply("✅`" + info.BasicInfo.Title + "`を一番最後からキューの先頭に移動しました").catch(e => Util.logger.log(e, "error"));
  }
}
