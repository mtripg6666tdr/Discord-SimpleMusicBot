import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { Util } from "../Util";

export default class Rewind extends BaseCommand {
  constructor(){
    super({
      name: "頭出し",
      alias: ["rewind", "gotop", "top"],
      description: "再生中の曲の頭出しを行います。",
      unlist: false,
      category: "player",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!options.data[message.guild.id].Player.IsPlaying){
      message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
    }else{
      options.data[message.guild.id].Player.Rewind();
      message.reply(":rewind:再生中の楽曲を頭出ししました:+1:").catch(e => Util.logger.log(e, "error"));
    }
  }
}