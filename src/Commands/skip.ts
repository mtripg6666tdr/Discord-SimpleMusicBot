import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Skip extends BaseCommand {
  constructor(){
    super({
      name: "スキップ",
      alias: ["skip", "s"],
      description: "現在再生中の曲をスキップします。",
      unlist: false,
      category: "player",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const server = options.data[message.guild.id];
    // そもそも再生状態じゃないよ...
    if(!server.Player.IsPlaying){
      await message.reply("再生中ではありません").catch(e => Util.logger.log(Util.general.StringifyObject(e), "error"));
      return;
    }else if(server.Player.preparing){
      await message.reply("再生準備中です").catch(e => Util.logger.log(Util.general.StringifyObject(e), "error"));
      return;
    }
    try{
      const response = await message.reply(":ok: スキップしています");
      const title = server.Queue.get(0).BasicInfo.Title;
      server.Player.Stop();
      await server.Queue.Next();
      await server.Player.Play();
      await response.edit(":track_next: `" + title + "`をスキップしました:white_check_mark:").catch(e => Util.logger.log(e, "error"));
    }
    catch(e){
      await message.channel.send(":astonished:スキップに失敗しました").catch(er => Util.logger.log(er, "error"));
    }
  }
}
