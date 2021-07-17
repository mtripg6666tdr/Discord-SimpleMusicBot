import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { getColor } from "../Util/colorUtil";
import { CalcTime, log } from "../Util/util";

export default class Uptime implements CommandInterface {
  name = "アップタイム";
  alias = ["アップタイム", "ピング", "uptime", "ping"];
  description = "ボットのアップタイムおよびping時間(レイテンシ)を表示します。";
  unlist = false;
  category = "utility";
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    const now = new Date();
    const insta = CalcTime(now.getTime() - options.bot.InstantiatedTime.getTime());
    const ready = CalcTime(now.getTime() - options.client.readyAt.getTime());
    const embed = new discord.MessageEmbed();
    embed.setColor(getColor("UPTIME"));
    embed.title = options.client.user.username + "のアップタイム";
    embed.addField("サーバー起動からの経過した時間", insta[0] + "時間" + insta[1] + "分" + insta[2] + "秒");
    embed.addField("Botが起動してからの経過時間", ready[0] + "時間" + ready[1] + "分" + ready[2] + "秒");
    embed.addField("レイテンシ", (new Date().getTime() - message.createdAt.getTime()) + "ミリ秒");
    embed.addField("データベースに登録されたサーバー数", Object.keys(options.data).length + "サーバー");
    message.channel.send(embed).catch(e => log(e, "error"));
  }
}