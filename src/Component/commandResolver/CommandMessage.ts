/*
 * Copyright 2021-2024 mtripg6666tdr
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

import { CommandMessage as LibCommandMessage } from "@mtripg6666tdr/oceanic-command-resolver";
import { defaultConfig } from "@mtripg6666tdr/oceanic-command-resolver";
import { AnyTextableGuildChannel, Message } from "oceanic.js";

import { normalizeText } from "../../Util";
import { subCommandSeparator } from "../../definition";
import { CommandManager } from "../commandManager";

defaultConfig.subCommandSeparator = subCommandSeparator;

export class CommandMessage extends LibCommandMessage {
  // 超省略形を解釈するために、基底クラスをオーバーライドします
  protected static override parseCommand(content: string, prefixLength: number){
    const resolved = super.parseCommand(content, prefixLength, normalizeText);
    // 超省略形を捕捉
    if(resolved.command.startsWith("http")){
      resolved.options.push(resolved.command);
      resolved.rawOptions = resolved.command;
      resolved.command = "play";
    }
    return resolved;
  }

  // サブコマンドを解決するために、基底クラスをオーバーライドします
  static override createFromMessage(message: Message<AnyTextableGuildChannel>, prefixLength?: number | undefined) {
    const resolved = this.parseCommand(message.content, prefixLength || 1);

    if(CommandManager.instance.subCommandNames.has(resolved.command)){
      const subCommand = resolved.options.shift();

      if(subCommand){
        resolved.command = `${resolved.command}${subCommandSeparator}${subCommand}`;
        resolved.rawOptions = resolved.options.join(" ");
      }
    }

    return CommandMessage.createFromMessageWithParsed(message, resolved.command, resolved.options, resolved.rawOptions);
  }
}
