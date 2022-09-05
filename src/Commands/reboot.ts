/*
 * Copyright 2021-2022 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

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
    if(message.member.id === (Util.config.adminId ?? "593758391395155978")){
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
