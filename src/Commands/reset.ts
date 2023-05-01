import type { CommandArgs, CommandInterface } from ".";
import type * as discord from "discord.js";

import { log } from "../Util/util";

export default class Reset implements CommandInterface {
  name = "リセット";
  alias = ["reset"];
  description = "サーバーのキュー、設定やデータを削除して初期化します。\r\n※接続中の場合ボイスチャンネルから離脱します。";
  unlist = false;
  category = "utility";
  async run(message: discord.Message, options: CommandArgs){
    options.updateBoundChannel(message);
    // VC接続中なら切断
    if(options.data[message.guild.id].Manager.IsConnecting){
      await options.data[message.guild.id].Manager.Disconnect();
    }
    // サーバープリファレンスをnullに
    options.data[message.guild.id] = null;
    // データ初期化
    options.initData(message.guild.id, message.channel.id);
    message.channel.send("✅サーバーの設定を初期化しました").catch(e => log(e, "error"));
  }
}
