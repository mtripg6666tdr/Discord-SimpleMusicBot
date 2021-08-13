import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { CommandMessage } from "../Component/CommandMessage"

export default class Bgm implements CommandInterface {
  name = "bgm";
  alias = ["study"];
  description = "開発者が勝手に作った勉強用・作業用BGMのプレイリストをキューに追加します。再生されてない場合再生が開始されます(可能な場合)。";
  unlist = false;
  category = "playlist";
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!(await options.Join(message))) return;
    const url = "https://www.youtube.com/playlist?list=PLLffhcApso9xIBMYq55izkFpxS3qi9hQK";
    await options.PlayFromURL(message, url, !options.data[message.guild.id].Manager.IsConnecting);
    options.data[message.guild.id].Manager.Play();
  }
}