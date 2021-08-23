import { CommandArgs, CommandInterface } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { log } from "../Util";

export default class Skip implements CommandInterface {
  name = "スキップ";
  alias = ["skip", "s"];
  description = "現在再生中の曲をスキップします。";
  unlist = false;
  category = "player";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    // そもそも再生状態じゃないよ...
    if(!options.data[message.guild.id].Player.IsPlaying){
      message.reply("再生中ではありません").catch(e => log(e, "error"));
      return;
    }
    const title = options.data[message.guild.id].Queue.get(0).BasicInfo.Title;
    options.data[message.guild.id].Player.Stop();
    await options.data[message.guild.id].Queue.Next();
    options.data[message.guild.id].Player.Play();
    message.reply(":track_next: `" + title + "`をスキップしました:white_check_mark:").catch(e => log(e, "error"));
  }
}