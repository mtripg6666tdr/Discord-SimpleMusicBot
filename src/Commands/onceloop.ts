import { CommandArgs, CommandInterface } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { log } from "../Util";

export default class OnceLoop implements CommandInterface {
  name = "ワンスループ";
  alias = ["onceloop", "looponce"];
  description = "現在再生中の再生が終了後、もう一度だけ同じ曲をループ再生します。";
  unlist = false;
  category = "player";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.OnceLoopEnabled){
      options.data[message.guild.id].Queue.OnceLoopEnabled = false;
      message.reply(":repeat_one:ワンスループを無効にしました:x:").catch(e => log(e, "error"));
    }else{
      options.data[message.guild.id].Queue.OnceLoopEnabled = true;
      message.reply(":repeat_one:ワンスループを有効にしました:o:").catch(e => log(e, "error"));
    }
  }
}