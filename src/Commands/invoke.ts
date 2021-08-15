import { Command, CommandArgs, CommandInterface, SlashCommandArgument } from ".";
import { CommandMessage } from "../Component/CommandMessage"

export default class Invoke implements CommandInterface {
  name = "インボーク";
  alias = ["invoke"];
  description = "指定されたコマンドを実行します。基本的に使用しないでください";
  unlist = true;
  category = "utility";
  argument = [{
    name: "command",
    description: "実行するコマンド",
    type: "string",
    required: true
  }] as SlashCommandArgument[];
  async run(message:CommandMessage, options:CommandArgs){
    const commandInfo = CommandMessage.resolveCommandMessage("/" + options.rawArgs, message.guild.id, options.data);
    if(commandInfo.command === "invoke"){
      await message.reply("invokeコマンドをinvokeコマンドで実行することはできません");
      return;
    }
    const ci = Command.Instance.resolve(commandInfo.command);
    if(ci){
      options.args = commandInfo.options;
      options.rawArgs = commandInfo.rawOptions;
      await ci.run(message, options);
    }else{
      await message.reply("コマンドが見つかりませんでした");
    }
  }
}