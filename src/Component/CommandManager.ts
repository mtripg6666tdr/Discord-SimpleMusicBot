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

import type { BaseCommand } from "../Commands";
import type { CommandOptionsTypes} from "../Structure";
import type { ApplicationCommandOptionsWithValue, Client } from "eris";

import { Constants } from "eris";

import * as fs from "fs";
import * as path from "path";

import { LogEmitter } from "../Structure";

/**
 * コマンドマネージャー
 */
export class CommandManager extends LogEmitter {
  private static _instance = null as CommandManager;
  /**
   * コマンドマネージャーの唯一のインスタンスを返します
   */
  static get instance(){
    if(this._instance) return this._instance;
    else return this._instance = new CommandManager();
  }

  /**
   * コマンドを返します
   */
  get commands():Readonly<BaseCommand[]>{
    return this._commands;
  }

  private readonly _commands = null as BaseCommand[];

  private constructor(){
    super();
    this.setTag("CommandsManager");
    this.Log("Initializing");
    this._commands = fs.readdirSync(path.join(__dirname, "../Commands/"), {withFileTypes: true})
      .filter(d => d.isFile())
      .map(d => d.name)
      .filter(n => n.endsWith(".js") && n !== "index.js")
      .map(n => n.slice(0, -3))
      .map(n => {
        // eslint-disable-next-line new-cap
        return new (require(path.join(__dirname, "../Commands/", n)).default)() as BaseCommand;
      });
    this.Log("Initialized");
  }

  /**
   * コマンド名でコマンドを解決します
   * @param command コマンド名
   * @returns 解決されたコマンド
   */
  resolve(command:string){
    this.Log("Resolving command");
    let result = null;
    for(let i = 0; i < this._commands.length; i++){
      if(this._commands[i].name === command || this._commands[i].alias.includes(command)){
        result = this._commands[i];
        break;
      }
    }
    if(result) this.Log(`Command "${command}" was resolved successfully`);
    else this.Log("Command not found");
    return result;
  }

  async sync(client:Client, removeOutdated:boolean = false){
    this.Log("Start syncing application commands");
    const registeredCommands = (await client.getCommands()).filter(command => command.type === Constants.ApplicationCommandTypes.CHAT_INPUT);
    this.Log(`Successfully get ${registeredCommands.length} commands`);
    const commandsToEdit = this.commands.filter(target => {
      if(target.unlist) return false;
      const index = registeredCommands.findIndex(reg => reg.name === target.asciiName);
      if(index < 0) return true;
      const registered = registeredCommands[index];
      return target.description.replace(/\r/g, "").replace(/\n/g, "") !== registered.description
        || (target.argument || []).length !== (registered.options || []).length
        || (target.argument && target.argument.some(
          (arg, i) =>
            !registered.options[i]
          || registered.options[i].name !== arg.name
          || registered.options[i].description !== arg.description
          || registered.options[i].type !== CommandManager.mapCommandOptionTypeToInteger(arg.type)
          || !!(registered.options[i] as ApplicationCommandOptionsWithValue).required !== arg.required
        ))
      ;
    });
    if(commandsToEdit.length > 0){
      this.Log(`Detected ${commandsToEdit.length} commands that should be updated; updating`);
      this.Log(`These are ${commandsToEdit.map(command => command.name)}`);
      await client.bulkEditCommands(this.commands.filter(cmd => !cmd.unlist).map(cmd => cmd.toApplicationCommandStructure()));
      this.Log("Updating success.");
    }else{
      this.Log("Detected no command that should be updated");
    }
    if(removeOutdated){
      const commandsToRemove = registeredCommands.filter(registered => {
        const index = this.commands.findIndex(command => registered.name === command.asciiName);
        return index < 0 || this.commands[index].unlist;
      });
      if(commandsToRemove.length > 0){
        this.Log(`Detected ${commandsToRemove.length} commands that should be removed; removing...`);
        this.Log(`These are ${commandsToRemove.map(command => command.name)}`);
        await client.bulkEditCommands([]);
        this.Log("Removing success.");
      }else{
        this.Log("Detected no command that should be removed");
      }
    }
  }

  async removeAllApplicationCommand(client:Client){
    this.Log("Removing all application commands");
    await client.bulkEditCommands([]);
    this.Log("Successfully removed all application commands");
  }

  async removeAllGuildCommand(client:Client, guildId:string){
    this.Log("Removing all guild commands of " + guildId);
    await client.bulkEditGuildCommands(guildId, []);
    this.Log("Successfully removed all guild commands");
  }

  static mapCommandOptionTypeToInteger(type:CommandOptionsTypes){
    switch(type){
      case "bool":
        return Constants.ApplicationCommandOptionTypes.BOOLEAN;
      case "integer":
        return Constants.ApplicationCommandOptionTypes.INTEGER;
      case "string":
        return Constants.ApplicationCommandOptionTypes.STRING;
    }
  }
}
