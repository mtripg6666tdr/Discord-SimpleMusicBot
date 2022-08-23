import type { CommandArgs } from ".";

import { CommandsManager, BaseCommand } from ".";
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
    const commandInfo = CommandMessage.resolveCommandMessage("/" + options.rawArgs);
    if(commandInfo.command === "invoke"){
      await message.reply("invokeコマンドをinvokeコマンドで実行することはできません");
      return;
    }
    const ci = CommandsManager.Instance.resolve(commandInfo.command);
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
}
