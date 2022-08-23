import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { YmxVersion } from "../Structure";
import { Util } from "../Util";

export default class Export extends BaseCommand {
  constructor(){
    super({
      name: "エクスポート",
      alias: ["export"],
      description: "キューの内容をインポートできるようエクスポートします。",
      unlist: false,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.length === 0){
      message.reply("キューが空です。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const qd = options.bot.exportQueue(message.guild.id);
    await message.reply({
      content: "✅エクスポートしました",
      files: [{
        file: Buffer.from(qd),
        name: "exported_queue.ymx",
      }]
    })
      .then(msg => msg.edit(`✅エクスポートしました (バージョン: v${YmxVersion}互換)\r\nインポート時は、「<${msg.url}>」をimportコマンドの引数に指定してください`))
      .catch(e => Util.logger.log(e, "error"))
    ;
  }
}
