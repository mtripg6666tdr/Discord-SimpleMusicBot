import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { Util } from "../Util";

export default class End extends BaseCommand {
  constructor(){
    super({
      name: "この曲で終了",
      alias: ["end"],
      description: "現在再生中の曲(再生待ちの曲)をのぞいてほかの曲をすべて削除します",
      unlist: false,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const guild = options.data[message.guild.id];
    if(!guild.Player.IsPlaying){
      message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(guild.Queue.length <= 1){
      message.reply("キューが空、もしくは一曲しかないため削除されませんでした。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    guild.Queue.RemoveFrom2();
    guild.Queue.QueueLoopEnabled = guild.Queue.OnceLoopEnabled = guild.Queue.LoopEnabled = false;
    message.reply("✅キューに残された曲を削除しました").catch(e => Util.logger.log(e, "error"));
  }
}