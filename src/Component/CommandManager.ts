/*
 * Copyright 2021-2023 mtripg6666tdr
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
import type { CommandOptionsTypes } from "../Structure";
import type { ApplicationCommandOptionsString, ApplicationCommandOptionsWithValue, Client } from "oceanic.js";

import * as fs from "fs";
import * as path from "path";

import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "oceanic.js";

import { LogEmitter } from "../Structure";
import { useConfig } from "../config";

const config = useConfig();

/**
 * コマンドマネージャー
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export class CommandManager extends LogEmitter<{}> {
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
  get commands(): Readonly<BaseCommand[]>{
    return this._commands;
  }

  private readonly _commands = null as BaseCommand[];

  private constructor(){
    super("CommandsManager");
    this.logger.info("Initializing");

    this._commands = fs.readdirSync(path.join(__dirname, "../Commands/"), { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name)
      .filter(n => n.endsWith(".js") && n !== "index.js")
      .map(n => n.slice(0, -3))
      .map(n => {
        // eslint-disable-next-line new-cap
        return new (require(path.join(__dirname, "../Commands/", n)).default)() as BaseCommand;
      })
      .filter(n => {
        if(n.name === "検索" && config.isDisabledSource("youtube")){
          return false;
        }else if(n.name === "searchb" && !process.env.BD_ENABLE){
          return false;
        }else if(n.name === "サウンドクラウドを検索" && config.isDisabledSource("soundcloud")){
          return false;
        }
        return true;
      });

    if(useConfig().debug) this.checkDuplicate();
    this.logger.info("Initialized");
  }

  checkDuplicate(){
    const sets = new Map<string, BaseCommand>();
    const setCommand = (name: string, command: BaseCommand) => {
      if(sets.has(name)){
        this.logger.warn(`Detected command ${command.name} the duplicated key ${name} with ${sets.get(name).name}; overwriting`);
      }
      sets.set(name, command);
    };
    this.commands.forEach(command => {
      setCommand(command.name, command);
      command.alias.forEach(name => setCommand(name, command));
    });
  }

  /**
   * コマンド名でコマンドを解決します
   * @param command コマンド名
   * @returns 解決されたコマンド
   */
  resolve(command: string){
    this.logger.info("Resolving command");
    let result = null;
    for(let i = 0; i < this._commands.length; i++){
      if(this._commands[i].name === command || this._commands[i].alias.includes(command)){
        result = this._commands[i];
        break;
      }
    }
    if(result){
      this.logger.info(`Command "${command}" was resolved successfully`);
    }else{
      this.logger.info("Command not found");
    }

    return result;
  }

  async sync(client: Client, removeOutdated: boolean = false){
    this.logger.info("Start syncing application commands");

    const registeredAppCommands = await client.application.getGlobalCommands();

    if(registeredAppCommands.length === 0){
      this.logger.info("Detected no command registered; bulk-registering slash-commands");
      await client.application.bulkEditGlobalCommands(
        this.commands
          .filter(command => !command.unlist)
          .map(command => command.toApplicationCommandStructure())
      );
      this.logger.info("Successfully registered");
      return;
    }

    const registeredCommands = registeredAppCommands.filter(command => command.type === ApplicationCommandTypes.CHAT_INPUT);

    this.logger.info(`Successfully get ${registeredCommands.length} commands`);
    const commandsToEdit = this.commands.filter(target => {
      if(target.unlist) return false;
      const registered = registeredCommands.find(reg => reg.name === target.asciiName);
      if(!registered) return false;
      return target.description.replace(/\r/g, "").replace(/\n/g, "") !== registered.description
        || (target.argument || []).length !== (registered.options || []).length
        || target.argument && target.argument.some(
          (arg, i) => {
            const choicesObjectMap: { [key: string]: string } = {};
            (registered.options[i] as ApplicationCommandOptionsString).choices?.forEach(c => choicesObjectMap[c.name] = c.value.toString());
            return !registered.options[i]
            || registered.options[i].name !== arg.name
            || registered.options[i].description !== arg.description
            || registered.options[i].type !== CommandManager.mapCommandOptionTypeToInteger(arg.type)
            || !!(registered.options[i] as ApplicationCommandOptionsWithValue).required !== arg.required
            || ((registered.options[i] as ApplicationCommandOptionsString).choices || arg.choices)
              && [...Object.keys(choicesObjectMap), ...Object.keys(arg.choices)].some(name => choicesObjectMap[name] !== arg.choices[name])
            ;
          }
        )
      ;
    });
    const commandsToAdd = this.commands.filter(target => {
      if(target.unlist) return false;
      const index = registeredCommands.findIndex(reg => reg.name === target.asciiName);
      return index < 0;
    });
    if(commandsToEdit.length > 0 || commandsToAdd.length > 0){
      this.logger.info(`Detected ${commandsToEdit.length + commandsToAdd.length} commands that should be updated; updating`);
      this.logger.info(`These are ${[...commandsToEdit, ...commandsToAdd].map(command => command.name)}`);
      for(let i = 0; i < commandsToEdit.length; i++){
        const commandToRegister = commandsToEdit[i].toApplicationCommandStructure();
        const id = registeredCommands.find(cmd => cmd.name === commandToRegister.name).id;
        await client.application.editGlobalCommand(id, commandToRegister);
      }
      for(let i = 0; i < commandsToAdd.length; i++){
        const commandToRegister = commandsToAdd[i].toApplicationCommandStructure();
        await client.application.createGlobalCommand(commandToRegister);
      }
      this.logger.info("Updating success.");
    }else{
      this.logger.info("Detected no command that should be updated");
    }
    if(removeOutdated){
      const commandsToRemove = registeredCommands.filter(registered => {
        const index = this.commands.findIndex(command => registered.name === command.asciiName);
        return index < 0 || this.commands[index].unlist;
      });
      if(commandsToRemove.length > 0){
        this.logger.info(`Detected ${commandsToRemove.length} commands that should be removed; removing...`);
        this.logger.info(`These are ${commandsToRemove.map(command => command.name)}`);
        await client.application.bulkEditGlobalCommands(this.commands.filter(cmd => !cmd.unlist).map(cmd => cmd.toApplicationCommandStructure()));
        this.logger.info("Removing success.");
      }else{
        this.logger.info("Detected no command that should be removed");
      }
    }
  }

  async removeAllApplicationCommand(client: Client){
    this.logger.info("Removing all application commands");
    await client.application.bulkEditGlobalCommands([]);
    this.logger.info("Successfully removed all application commands");
  }

  async removeAllGuildCommand(client: Client, guildId: string){
    this.logger.info("Removing all guild commands of " + guildId);
    await client.application.bulkEditGuildCommands(guildId, []);
    this.logger.info("Successfully removed all guild commands");
  }

  static mapCommandOptionTypeToInteger(type: CommandOptionsTypes){
    switch(type){
      case "bool":
        return ApplicationCommandOptionTypes.BOOLEAN;
      case "integer":
        return ApplicationCommandOptionTypes.INTEGER;
      case "string":
        return ApplicationCommandOptionTypes.STRING;
    }
  }
}
