import { exec, execSync } from "child_process";
import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { Util } from "../Util";

export default class Reboot extends BaseCommand {
  constructor(){
    super({
      name: "reboot",
      alias: [] as string[],
      unlist: true,
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(message.author.id === (Util.config.adminId ?? "593758391395155978")){
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