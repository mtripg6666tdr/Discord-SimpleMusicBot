import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { Util } from "../Util";

export default class Pause extends BaseCommand {
  constructor(){
    super({
      name: "一時停止",
      alias: ["一旦停止", "停止", "pause", "stop"],
      description: "再生を一時停止します。",
      unlist: false,
      category: "player",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const server = options.data[message.guild.id];
    // そもそも再生状態じゃないよ...
    if(!server.Player.IsPlaying){
      await message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(server.Player.IsPaused){
      await message.reply(":pause_button: すでに一時停止されています\r\n再生を再開するには`再生`コマンドを使用してください").catch(e => Util.logger.log(e, "error"));
      return;
    }
    // 停止しま～す
    server.Player.Pause();
    message.reply(":pause_button: 一時停止しました").catch(e => Util.logger.log(e, "error"));
  }
}