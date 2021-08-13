import { CommandArgs, CommandInterface } from ".";
import { CommandLike } from "../Component/CommandLike";
import { log } from "../Util/util";

export default class Loop implements CommandInterface {
  name = "ループ";
  alias = ["トラックループ", "loop", "repeat", "trackloop", "trackrepeat"];
  description = "トラックごとのループを設定します。";
  unlist = false;
  category = "player";
  async run(message:CommandLike, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.LoopEnabled){
      options.data[message.guild.id].Queue.LoopEnabled = false;
      message.channel.send(":repeat_one:トラックリピートを無効にしました:x:").catch(e => log(e, "error"));
    }else{
      options.data[message.guild.id].Queue.LoopEnabled = true;
      message.channel.send(":repeat_one:トラックリピートを有効にしました:o:").catch(e => log(e, "error"));
    }
  }
}
