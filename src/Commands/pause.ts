import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
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
    options.server.updateBoundChannel(message);
    // そもそも再生状態じゃないよ...
    if(!options.server.player.isPlaying){
      await message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(options.server.player.isPaused){
      await message.reply(":pause_button: すでに一時停止されています\r\n再生を再開するには`再生`コマンドを使用してください").catch(e => Util.logger.log(e, "error"));
      return;
    }
    // 停止しま～す
    options.server.player.pause();
    message.reply(":pause_button: 一時停止しました").catch(e => Util.logger.log(e, "error"));
  }
}
