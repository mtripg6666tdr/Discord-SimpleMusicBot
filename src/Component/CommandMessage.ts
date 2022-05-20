import { CommandMessage as LibCommandMessage } from "djs-command-resolver";
import { Util } from "../Util";

export class CommandMessage extends LibCommandMessage {
  protected static override parseCommand(content:string, prefixLength:number){
    const resolved = super.parseCommand(content, prefixLength, Util.string.NormalizeText);
    // 超省略形を捕捉
    if(resolved.command.startsWith("http")){
      resolved.options.push(resolved.command);
      resolved.rawOptions = resolved.command;
      resolved.command = "play";
    }
    return resolved;
  }

  static override resolveCommandMessage(content: string, prefixLength: number = 1){
    const resolved = CommandMessage.parseCommand(content, prefixLength);
    resolved.command = resolved.command.toLowerCase();
    return resolved;
  }
}