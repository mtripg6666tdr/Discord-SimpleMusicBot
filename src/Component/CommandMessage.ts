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

import { CommandMessage as LibCommandMessage } from "@mtripg6666tdr/eris-command-resolver";

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
