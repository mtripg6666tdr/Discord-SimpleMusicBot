import { CommandArgs, CommandInterface } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { log } from "../Util";

export default class Cancel implements CommandInterface {
  name = "cancel";
  alias = ["キャンセル", "中止", "abort"];
  description = "実行中のキャンセル可能な処理がある場合それをすべて中止します。";
  unlist = false;
  category = "utility";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    options.cancellations.forEach(c => c.GuildId === message.guild.id && c.Cancel());
    await message.reply("処理中の処理をすべてキャンセルしています....").catch(e => log(e, "error"));
  }
}