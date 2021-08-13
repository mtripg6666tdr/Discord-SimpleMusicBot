import { CommandArgs, CommandInterface } from ".";
import { CommandLike } from "../Component/CommandLike";
import { log } from "../Util/util";

export default class QueueLoop implements CommandInterface {
  name = "キューループ";
  alias = ["queueloop", "loopqueue"];
  description = "キュー内のループを設定します。";
  unlist = false;
  category = "player";
  async run(message:CommandLike, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.QueueLoopEnabled){
      options.data[message.guild.id].Queue.QueueLoopEnabled = false;
      message.channel.send(":repeat:キューリピートを無効にしました:x:").catch(e => log(e, "error"));
    }else{
      options.data[message.guild.id].Queue.QueueLoopEnabled = true;
      message.channel.send(":repeat:キューリピートを有効にしました:o:").catch(e => log(e, "error"));
    }
  }
}