import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage";
import { log } from "../Util";

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
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.length === 0){
      message.reply("キューが空です。").catch(e => log(e, "error"));
      return;
    }
    options.data[message.guild.id].Queue.Shuffle();
    message.reply(":twisted_rightwards_arrows:シャッフルしました✅").catch(e => log(e, "error"));
  }
}