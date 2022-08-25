import type { CommandArgs } from ".";
import type { CommandMessage } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import Util from "../Util";

export default class Volume extends BaseCommand {
  constructor(){
    super({
      name: "ボリューム",
      alias: ["volume", "vol"],
      description: "音量を調節します。20から200の間で指定します(デフォルト100)。何も引数を付けないと現在の音量を表示します。不安定になった場合には100に戻してください。",
      unlist: false,
      category: "voice",
      examples: "volume <音量>",
      usage: "volume 120",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.rawArgs === ""){
      await message.channel.createMessage(`:loud_sound:現在の音量は**${options.data[message.guild.id].Player.volume}**です(デフォルト:100)`)
        .catch(e => Util.logger.log(e, "error"))
      ;
      return;
    }
    const newval = Number(options.rawArgs);
    if(isNaN(newval) || newval < 1 || newval > 200){
      message.channel.createMessage(":bangbang:音量を変更する際は1から200の数字で指定してください。")
        .catch(e => Util.logger.log(e, "error"));
      return;
    }
    const result = options.data[message.guild.id].Player.setVolume(newval);
    await message.channel.createMessage(`:loud_sound:音量を**${newval}**に変更しました。\r\n${!result ? "次の曲から適用されます。現在再生中の曲に設定を適用するには、`頭出し`コマンドなどを使用してください。" : ""}`)
      .catch(e => Util.logger.log(e, "error"));
  }
}
