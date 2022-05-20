import * as discord from "discord.js";
import * as voice from "@discordjs/voice";
import { CommandArgs, BaseCommand } from ".";
import { getColor } from "../Util/color";
import { Util } from "../Util";
import { CommandMessage } from "../Component/CommandMessage";

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
    const ready = Util.time.CalcTime(now.getTime() - options.client.readyAt.getTime());
    const embed = new discord.MessageEmbed()
      .setColor(getColor("UPTIME"))
      .setTitle(options.client.user.username + "のアップタイム")
      .addField("サーバー起動からの経過した時間", insta[0] + "時間" + insta[1] + "分" + insta[2] + "秒")
      .addField("Botが起動してからの経過時間", ready[0] + "時間" + ready[1] + "分" + ready[2] + "秒")
      .addField("レイテンシ", 
          (now.getTime() - message.createdAt.getTime()) + "ミリ秒(ボット接続実測値)\r\n"
        + options.client.ws.ping + "ミリ秒(ボットWebSocket接続取得値)\r\n"
        + (voice.getVoiceConnection(message.guild.id)?.ping.udp ?? "-") + "ミリ秒(ボイスチャンネルUDP接続取得値)"
      )
      .addField("データベースに登録されたサーバー数", Object.keys(options.data).length + "サーバー");
    message.reply({embeds:[embed]}).catch(e => Util.logger.log(e, "error"));
  }
}