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

import { BaseCommand } from ".";
import { CommandManager } from "../Component/CommandManager";
import { CommandMessage } from "../Component/CommandMessage";
import Util from "../Util";

export default class Invoke extends BaseCommand {
  constructor(){
    super({
      name: "インボーク",
      alias: ["invoke"],
      description: "指定されたコマンドを実行します。基本的に使用しないでください",
      unlist: false,
      category: "utility",
      argument: [{
        name: "command",
        description: "実行するコマンド",
        type: "string",
        required: true
      }],
      usage: "invoke <コマンド>",
      examples: "invoke play 夜に駆ける"
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(options.rawArgs.startsWith("sp;") && message.member.id === Util.config.adminId){
      this.evaluateSpecialCommands(options.rawArgs.substring(3), message, options)
        .then(result => message.reply(result))
        .catch(er => Util.logger.log(er, "error"))
      ;
      return;
    }
    const commandInfo = CommandMessage.resolveCommandMessage(options.rawArgs, 0);
    if(commandInfo.command === "invoke"){
      await message.reply("invokeコマンドをinvokeコマンドで実行することはできません").catch(er => Util.logger.log(er, "error"));
      return;
    }
    const ci = CommandManager.instance.resolve(commandInfo.command);
    if(ci){
      options.args = commandInfo.options;
      options.rawArgs = commandInfo.rawOptions;
      await ci.run(message, options).catch(er => Util.logger.log(er));
      if(!message["isMessage"] && !message["_interactionReplied"]){
        await message.reply("実行しました").catch(er => Util.logger.log(er));
      }
    }else{
      await message.reply("コマンドが見つかりませんでした").catch(er => Util.logger.log(er));
    }
  }

  private async evaluateSpecialCommands(specialCommand:string, message:CommandMessage, options:CommandArgs){
    switch(specialCommand){
      case "cleanupsc":
        await CommandManager.instance.sync(options.client, true);
        break;
      case "removesca":
        CommandManager.instance.removeAllApplicationCommand(options.client);
        break;
      case "removescg":
        CommandManager.instance.removeAllGuildCommand(options.client, message.guild.id);
        break;
      default:
        return "特別コマンドが見つかりません。";
    }
    return "完了しました";
  }
}
