import { exec, execSync } from "child_process";
import * as discord from "discord.js";
import { CommandArgs, CommandInterface } from ".";
import { log } from "../Util/util";

export default class Reboot implements CommandInterface {
  name = "reboot";
  alias = [] as string[];
  unlist = true;
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    if(message.author.id === "593758391395155978"){
      if(options.rawArgs === ""){
        message.channel.send("再起動を実行します...お待ちください...");
        exec("npm run onlystart");
        setTimeout(()=> process.exit(0),500);
      }else if(options.rawArgs === "update"){
        await message.channel.send("アップデートして再起動を実行します。完了まで10分程度要することがあります。");
        await message.channel.send("アップデート中...");
        let buf = execSync("git pull");
        await message.channel.send("実行結果:\r\n```" + buf.toString() + "\r\n```");
        await message.channel.send("コンパイル中...");
        buf = execSync("npm run build");
        await message.channel.send("実行結果:\r\n```" + buf.toString() + "\r\n```");
        await message.channel.send("再起動しています...");
        exec("npm run onlystart");
        setTimeout(()=> process.exit(0),500);
      }
    }
  }
}