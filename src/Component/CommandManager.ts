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
import type { AnyApplicationCommand, ChatInputApplicationCommand, Client, CreateApplicationCommandOptions } from "oceanic.js";

import * as fs from "fs";
import * as path from "path";
import util from "util";

import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "oceanic.js";

import { LogEmitter } from "../Structure";
import { useConfig } from "../config";

// const commandSeparator = "_";

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
      .filter(n => !n.disabled);

    if(useConfig().debug){
      this.checkDuplicate();
    }
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

    // format local commands into the api-compatible well-formatted ones
    const apiCompatibleCommands: CreateApplicationCommandOptions[] = this.commands
      .filter(command => !command.unlist)
      .map(command => command.toApplicationCommandStructure());

    // // create api compatible command structure without commands grouping
    // const rawApiCompatibleCommands = this.commands
    //   .filter(command => !command.unlist)
    //   .map(command => command.toApplicationCommandStructure());
    // // create root command map
    // const rootCommandsMap: Map<string, CreateApplicationCommandOptions> = new Map();
    // rawApiCompatibleCommands.forEach(command => {
    //   if(!command.name.includes(commandSeparator)){
    //     rootCommandsMap.set(command.name, command);
    //     apiCompatibleCommands.push(command);
    //   }
    // });
    // // finalize api-compatible commands
    // rawApiCompatibleCommands.forEach(command => {
    //   const commandStructure = command.name.split(commandSeparator);
    //   const rootCommandName = commandStructure[0];
    //   const rootCommand = rootCommandsMap.get(rootCommandName);
    //   // TODO: group commands
    // });

    // Get registered commands
    const registeredAppCommands = await client.application.getGlobalCommands({ withLocalizations: true });

    // no registered commands, bulk-registering them
    if(registeredAppCommands.length === 0){
      this.logger.info("Detected no command registered; bulk-registering slash-commands");
      await client.application.bulkEditGlobalCommands(apiCompatibleCommands);
      this.logger.info("Successfully registered");
      return;
    }

    // filter slash-commands
    const registeredCommands = registeredAppCommands
      .filter(command => command.type === ApplicationCommandTypes.CHAT_INPUT) as ChatInputApplicationCommand[];

    this.logger.info(`Successfully get ${registeredCommands.length} commands`);

    // search commands that should be updated
    const commandsToEdit = apiCompatibleCommands.filter(expected => {
      const actual = registeredCommands.find(command => command.name === expected.name);
      if(!actual){
        return false;
      }else{
        return !this.sameCommand(actual, expected);
      }
    });

    // search commands that should be added newly
    const commandsToAdd = apiCompatibleCommands.filter(expected => {
      return registeredCommands.findIndex(reg => reg.name === expected.name) < 0;
    });

    // if there are any commands that should be added or updated
    if(commandsToEdit.length > 0 || commandsToAdd.length > 0){
      this.logger.info(`Detected ${commandsToEdit.length + commandsToAdd.length} commands that should be updated; updating`);
      this.logger.info(`These are ${[...commandsToEdit, ...commandsToAdd].map(command => command.name)}`);
      for(let i = 0; i < commandsToEdit.length; i++){
        const commandToRegister = commandsToEdit[i];
        const id = registeredCommands.find(cmd => cmd.name === commandToRegister.name).id;
        await client.application.editGlobalCommand(id, commandToRegister);
      }
      for(let i = 0; i < commandsToAdd.length; i++){
        const commandToRegister = commandsToAdd[i];
        await client.application.createGlobalCommand(commandToRegister);
      }
      this.logger.info("Updating success.");
    }else{
      this.logger.info("Detected no command that should be updated");
    }

    // remove outdated commands (that doesn't recognized as the bot's command)
    if(removeOutdated){
      const commandsToRemove = registeredCommands.filter(registered => {
        const index = apiCompatibleCommands.findIndex(command => registered.name === command.name);
        return index < 0;
      });
      if(commandsToRemove.length > 0){
        this.logger.info(`Detected ${commandsToRemove.length} commands that should be removed; removing...`);
        this.logger.info(`These are ${commandsToRemove.map(command => command.name)}`);
        await client.application.bulkEditGlobalCommands(apiCompatibleCommands);
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

  sameCommand(actual: ChatInputApplicationCommand, expected: CreateApplicationCommandOptions): boolean{
    return util.isDeepStrictEqual(
      this.apiToApplicationCommand(actual),
      expected,
    );
  }

  protected apiToApplicationCommand(apiCommand: AnyApplicationCommand) {
    if(apiCommand.options){
      return {
        type: apiCommand.type,
        name: apiCommand.name,
        description: apiCommand.description,
        descriptionLocalizations: apiCommand.descriptionLocalizations,
        options: apiCommand.options.map(option => {
          if("choices" in option && option.choices){
            return {
              type: option.type,
              name: option.name,
              description: option.description,
              descriptionLocalizations: option.descriptionLocalizations,
              required: !!option.required,
              choices: option.choices.map(choice => ({
                name: choice.name,
                value: choice.value,
                // @ts-expect-error
                nameLocalizations: choice.nameLocalizations || choice.name_localizations,
              })),
            };
          }else{
            return {
              type: option.type,
              name: option.name,
              description: option.description,
              descriptionLocalizations: option.descriptionLocalizations,
              required: !!option.required,
            };
          }
        }),
      };
    }else{
      return {
        type: apiCommand.type,
        name: apiCommand.name,
        description: apiCommand.description,
        descriptionLocalizations: apiCommand.descriptionLocalizations,
      };
    }
  }

  static mapCommandOptionTypeToInteger(type: CommandOptionsTypes){
    switch(type){
      case "bool":
        return ApplicationCommandOptionTypes.BOOLEAN;
      case "integer":
        return ApplicationCommandOptionTypes.INTEGER;
      case "string":
        return ApplicationCommandOptionTypes.STRING;
      case "file":
        return ApplicationCommandOptionTypes.ATTACHMENT;
    }
  }
}
