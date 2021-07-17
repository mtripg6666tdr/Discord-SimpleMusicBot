import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { log } from "../Util/util";

export default class Shuffle implements CommandInterface {
  name = "シャッフル";
  alias = ["shuffle"];
  description = "キューの内容をシャッフルします。";
  unlist = false;
  category = "playlist";
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].Queue.length === 0){
      message.channel.send("キューが空です。").catch(e => log(e, "error"));
      return;
    }
    options.data[message.guild.id].Queue.Shuffle();
    message.channel.send(":twisted_rightwards_arrows:シャッフルしました✅").catch(e => log(e, "error"));
  }
}