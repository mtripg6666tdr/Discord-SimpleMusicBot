import { CommandArgs, CommandInterface } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { log } from "../Util";

export default class Dc implements CommandInterface {
  name = "切断";
  alias = ["終了", "dc", "disconnect", "leave", "quit"];
  description = "ボイスチャンネルから切断します。";
  unlist = false;
  category = "voice";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    // そもそも再生状態じゃないよ...
    if(!options.data[message.guild.id].Player.IsConnecting){
      message.reply("再生中ではありません").catch(e => log(e, "error"));
      return;
    }
    // 停止しま～す
    options.data[message.guild.id].Player.Disconnect();
    message.reply(":postbox: 正常に切断しました").catch(e => log(e, "error"));
  }
}