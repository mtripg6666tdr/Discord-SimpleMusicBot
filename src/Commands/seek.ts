import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Seek extends BaseCommand {
  constructor(){
    super({
      name: "シーク",
      alias: ["seek"],
      description: "楽曲をシークします。",
      unlist: false,
      category: "player",
      examples: "シーク 0:30",
      usage: "検索 <時間(秒数または時間:分:秒の形式で)>",
      argument: [{
        type: "string",
        name: "keyword",
        description: "シーク先の時間",
        required: true
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    const server = options.server;
    // そもそも再生状態じゃないよ...
    if(!server.player.isPlaying || server.player.preparing){
      await message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
      return;
    }else if(server.player.currentAudioInfo.LengthSeconds === 0 || server.player.currentAudioInfo.isUnseekable()){
      await message.reply(":warning:シーク先に対応していない楽曲です").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const time = (function(rawTime){
      if(rawTime.match(/^(\d+:)*\d+$/)){
        return rawTime.split(":").map(d => Number(d))
          .reduce((prev, current) => prev * 60 + current);
      }else{
        return NaN;
      }
    }(options.rawArgs));
    if(time > server.player.currentAudioInfo.LengthSeconds || isNaN(time)){
      await message.reply(":warning:シーク先の時間が正しくありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    try{
      const response = await message.reply(":rocket:シークしています...");
      server.player.stop();
      await server.player.play(time);
      await response.edit(":white_check_mark:シークしました").catch(e => Util.logger.log(e, "error"));
    }
    catch(e){
      await message.channel.createMessage(":astonished:シークに失敗しました").catch(er => Util.logger.log(er, "error"));
    }
  }
}
