import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

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
    options.server.updateBoundChannel(message);
    // VC接続中なら切断
    if(options.server.player.isConnecting){
      options.server.player.disconnect();
    }
    // サーバープリファレンスをnullに
    options.server = null;
    // データ初期化
    options.initData(message.guild.id, message.channel.id);
    message.reply("✅サーバーの設定を初期化しました").catch(e => Util.logger.log(e, "error"));
  }
}
