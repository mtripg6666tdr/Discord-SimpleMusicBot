import { CommandArgs, CommandInterface } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { log } from "../Util";

export default class QueueLoop implements CommandInterface {
  name = "キューループ";
  alias = ["queueloop", "loopqueue"];
  description = "キュー内のループを設定します。";
  unlist = false;
  category = "player";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.QueueLoopEnabled){
      options.data[message.guild.id].Queue.QueueLoopEnabled = false;
      message.reply(":repeat:キューリピートを無効にしました:x:").catch(e => log(e, "error"));
    }else{
      options.data[message.guild.id].Queue.QueueLoopEnabled = true;
      message.reply(":repeat:キューリピートを有効にしました:o:").catch(e => log(e, "error"));
    }
  }
}