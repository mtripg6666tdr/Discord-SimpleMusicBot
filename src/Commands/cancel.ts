import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Cancel extends BaseCommand {
  constructor(){
    super({
      name: "キャンセル",
      alias: ["cancel", "中止", "abort"],
      description: "実行中のキャンセル可能な処理がある場合それをすべて中止します。",
      unlist: false,
      category: "utility",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    const result = options.server.cancelAll();
    if(result){
      await message.reply("処理中の処理をすべてキャンセルしています....").catch(e => Util.logger.log(e, "error"));
    }else{
      await message.reply("キャンセルできる処理がありませんでした").catch(e => Util.logger.log(e, "error"));
    }
  }
}
