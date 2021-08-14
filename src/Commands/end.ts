import { CommandArgs, CommandInterface } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { log } from "../Util";

export default class End implements CommandInterface {
  name = "この曲で終了";
  alias = ["end"];
  description = "現在再生中の曲(再生待ちの曲)をのぞいてほかの曲をすべて削除します";
  unlist = false;
  category = "playlist";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!options.data[message.guild.id].Manager.IsPlaying){
      message.reply("再生中ではありません").catch(e => log(e, "error"));
      return;
    }
    if(options.data[message.guild.id].Queue.length <= 1){
      message.reply("キューが空、もしくは一曲しかないため削除されませんでした。").catch(e => log(e, "error"));
      return;
    }
    options.data[message.guild.id].Queue.RemoveFrom2();
    message.reply("✅キューに残された曲を削除しました").catch(e => log(e, "error"));
  }
}