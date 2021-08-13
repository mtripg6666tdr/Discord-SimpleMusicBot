import { CommandArgs, CommandInterface } from ".";
import { CommandLike } from "../Component/CommandLike";
import { log } from "../Util/util";

export default class Skip implements CommandInterface {
  name = "スキップ";
  alias = ["skip", "s"];
  description = "現在再生中の曲をスキップします。";
  unlist = false;
  category = "player";
  async run(message:CommandLike, options:CommandArgs){
    options.updateBoundChannel(message);
    // そもそも再生状態じゃないよ...
    if(!options.data[message.guild.id].Manager.IsPlaying){
      message.channel.send("再生中ではありません").catch(e => log(e, "error"));
      return;
    }
    const title = options.data[message.guild.id].Queue.get(0).BasicInfo.Title;
    options.data[message.guild.id].Manager.Stop();
    await options.data[message.guild.id].Queue.Next();
    options.data[message.guild.id].Manager.Play();
    message.channel.send(":track_next: `" + title + "`をスキップしました:white_check_mark:").catch(e => log(e, "error"));
  }
}