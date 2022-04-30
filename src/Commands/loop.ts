import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { log } from "../Util";

export default class Loop extends BaseCommand {
  constructor(){
    super({
      name: "ループ",
      alias: ["トラックループ", "loop", "repeat", "trackloop", "trackrepeat"],
      description: "トラックごとのループを設定します。",
      unlist: false,
      category: "player",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.LoopEnabled){
      options.data[message.guild.id].Queue.LoopEnabled = false;
      message.reply(":repeat_one:トラックリピートを無効にしました:x:").catch(e => log(e, "error"));
    }else{
      options.data[message.guild.id].Queue.LoopEnabled = true;
      message.reply(":repeat_one:トラックリピートを有効にしました:o:").catch(e => log(e, "error"));
    }
  }
}
