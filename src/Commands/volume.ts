import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { log } from "../Util/util";

export default class Volume implements CommandInterface {
  name = "ボリューム";
  alias = ["volume"];
  description = "音量を調節します。1から200の間で指定します(デフォルト100)。何も引数を付けないと現在の音量を表示します。";
  unlist = false;
  category = "voice";
  examples = "volume <音量>";
  usage = "volume 120";
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!options.data[message.guild.id].Manager.IsPlaying){
      message.channel.send("なにも再生していません").catch(e => log(e, "error"));
      return;
    }
    if(options.rawArgs === ""){
      message.channel.send(":loud_sound:現在の音量は**" + options.data[message.guild.id].Manager.volume + "**です(デフォルト:100)").catch(e => log(e, "error"));
      return;
    }
    const newval = Number(options.rawArgs);
    if(isNaN(newval) || newval < 1 || newval > 200){
      message.channel.send(":bangbang:音量を変更する際は1から200の数字で指定してください。").catch(e =>log(e, "error"));
      return;
    }
    options.data[message.guild.id].Manager.volume = newval;
    message.channel.send(":loud_sound:音量を**" + newval + "**に変更しました").catch(e => log(e, "error"));
  }
}