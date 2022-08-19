import type { CommandArgs } from ".";

import { CommandsManager, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage";

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
      await ci.run(message, options);
    }else{
      await message.reply("コマンドが見つかりませんでした");
    }
  }
}
