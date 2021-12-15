import * as discord from "discord.js";
import * as voice from "@discordjs/voice";
import getExactTime from "ntp-client-promise";
import { CommandArgs, CommandInterface } from ".";
import { getColor } from "../Util/colorUtil";
import { CalcTime, log } from "../Util";
import { CommandMessage } from "../Component/CommandMessage";

export default class Uptime implements CommandInterface {
  name = "アップタイム";
  alias = ["アップタイム", "ピング", "uptime", "ping"];
  description = "ボットのアップタイムおよびping時間(レイテンシ)を表示します。";
  unlist = false;
  category = "utility";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const now = await getExactTime("time.google.com");
    const sno = new Date();
    const insta = CalcTime(now.getTime() - options.bot.InstantiatedTime.getTime());
    const ready = CalcTime(now.getTime() - options.client.readyAt.getTime());
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
      .addField("時刻設定", `システム時刻: ${sno.toISOString()}\r\n正確な時刻: ${now.toISOString()}\r\n遅延: ${now.getTime() - sno.getTime()}ミリ秒`)
      .addField("データベースに登録されたサーバー数", Object.keys(options.data).length + "サーバー");
    message.reply({embeds:[embed]}).catch(e => log(e, "error"));
  }
}