import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { log } from "../Util";

export default class Reset extends BaseCommand {
  constructor(){
    super({
      name: "リセット",
      alias: ["reset"],
      description: "サーバーのキュー、設定やデータを削除して初期化します。\r\n※接続中の場合ボイスチャンネルから離脱します。",
      unlist: false,
      category: "utility",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    // VC接続中なら切断
    if(options.data[message.guild.id].Player.IsConnecting){
      options.data[message.guild.id].Player.Disconnect();
    }
    // サーバープリファレンスをnullに
    options.data[message.guild.id] = null;
    // データ初期化
    options.initData(message.guild.id, message.channel.id);
    message.reply("✅サーバーの設定を初期化しました").catch(e => log(e, "error"));
  }
}