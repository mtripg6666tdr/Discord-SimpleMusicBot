import { CommandArgs, CommandInterface } from ".";
import { CommandLike } from "../Component/CommandLike";
import { log } from "../Util/util";

export default class Rewind implements CommandInterface {
  name = "頭出し";
  alias = ["rewind", "gotop", "top"];
  description = "再生中の曲の頭出しを行います。";
  unlist = false;
  category = "player";
  async run(message:CommandLike, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!options.data[message.guild.id].Manager.IsPlaying){
      message.channel.send("再生中ではありません").catch(e => log(e, "error"));
      return;
    }
    options.data[message.guild.id].Manager.Rewind();
    message.channel.send(":rewind:再生中の楽曲を頭出ししました:+1:").catch(e => log(e, "error"));
  }
}