import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { YmxVersion } from "../definition";
import { log } from "../Util/util";

export default class Export implements CommandInterface {
  name = "エクスポート";
  alias = ["export"];
  description = "キューの内容をインポートできるようエクスポートします。";
  unlist = false;
  category = "playlist";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.length === 0){
      message.reply("キューが空です。").catch(e => log(e, "error"));
      return;
    }
    const qd = options.bot.exportQueue(message.guild.id);
    message.reply({
      content:"✅エクスポートしました", 
      files: [new discord.MessageAttachment(Buffer.from(qd), "exported_queue.ymx")]
    }).then(msg => {
      msg.edit("✅エクスポートしました (バージョン: v" + YmxVersion + "互換)\r\nインポート時は、「" + msg.url + " 」をimportコマンドの引数に指定してください").catch(e => log(e, "error"))
    }).catch(e => log(e, "error"));
  }
}