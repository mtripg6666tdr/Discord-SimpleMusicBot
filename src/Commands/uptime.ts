import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class Uptime extends BaseCommand {
  constructor(){
    super({
      name: "アップタイム",
      alias: ["アップタイム", "ピング", "uptime", "ping"],
      description: "ボットのアップタイムおよびping時間(レイテンシ)を表示します。",
      unlist: false,
      category: "utility",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const now = new Date();
    const insta = Util.time.CalcTime(now.getTime() - options.bot.InstantiatedTime.getTime());
    const ready = Util.time.CalcTime(options.client.uptime);
    const embed = new Helper.MessageEmbedBuilder()
      .setColor(getColor("UPTIME"))
      .setTitle(options.client.user.username + "のアップタイム")
      .addField("サーバー起動からの経過した時間", insta[0] + "時間" + insta[1] + "分" + insta[2] + "秒")
      .addField("Botが起動してからの経過時間", ready[0] + "時間" + ready[1] + "分" + ready[2] + "秒")
      .addField("レイテンシ",
        `${now.getTime() - message.createdAt.getTime()}ミリ秒(ボット接続実測値)\r\n`
        + `${message.guild.shard.latency}ミリ秒(ボットWebSocket接続取得値)\r\n`
        + `${(options.data[message.guild.id].Player.isConnecting && options.data[message.guild.id].VcPing) || "-"}ミリ秒(ボイスチャンネルUDP接続取得値)`
      )
      .addField("データベースに登録されたサーバー数", Object.keys(options.data).length + "サーバー")
      .toEris()
    ;
    message.reply({embeds: [embed]}).catch(e => Util.logger.log(e, "error"));
  }
}
