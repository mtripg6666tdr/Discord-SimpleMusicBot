import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { exec, execSync } from "child_process";

import { BaseCommand } from ".";
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
        message.channel.createMessage("再起動を実行します...お待ちください...");
        exec("npm run onlystart");
        setTimeout(()=> process.exit(0), 500);
      }else if(options.rawArgs === "update"){
        await message.channel.createMessage("アップデートして再起動を実行します。完了まで10分程度要することがあります。");
        await message.channel.createMessage("アップデート中...");
        let buf = execSync("git pull");
        await message.channel.createMessage("実行結果:\r\n```" + buf.toString() + "\r\n```");
        await message.channel.createMessage("コンパイル中...");
        buf = execSync("npm run build");
        await message.channel.createMessage("実行結果:\r\n```" + buf.toString() + "\r\n```");
        await message.channel.createMessage("再起動しています...");
        exec("npm run onlystart");
        setTimeout(()=> process.exit(0), 500);
      }
    }
  }
}
