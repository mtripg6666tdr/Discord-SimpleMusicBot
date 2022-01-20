import { CommandArgs, CommandInterface } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { log } from "../Util";

export default class Pause implements CommandInterface {
  name = "一時停止";
  alias = ["一旦停止", "停止", "pause", "stop"];
  description = "再生を一時停止します。";
  unlist = false;
  category = "player";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const server = options.data[message.guild.id];
    // そもそも再生状態じゃないよ...
    if(!server.Player.IsPlaying || server.Player.IsPaused){
      await message.reply("再生中ではありません").catch(e => log(e, "error"));
      return;
    }
    // 停止しま～す
    server.Player.Pause();
    message.reply(":pause_button: 一時停止しました").catch(e => log(e, "error"));
  }
}