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

import type { BaseCommand } from "../Commands";
import type { CommandOptionsTypes } from "../Structure";
import type { AnyApplicationCommand, ApplicationCommandOptions, ApplicationCommandOptionsSubCommand, ApplicationCommandOptionsWithValue, ChatInputApplicationCommand, Client, CreateApplicationCommandOptions, CreateChatInputApplicationCommandOptions, Locale, MessageApplicationCommand } from "oceanic.js";

import util from "util";

import i18next from "i18next";
import { ApplicationCommandOptionTypes, ApplicationCommandTypes } from "oceanic.js";

import { LogEmitter } from "../Structure";
import { measureTime } from "../Util/decorators";
import { getConfig } from "../config";
import { subCommandSeparator } from "../definition";
import { availableLanguages } from "../i18n";

// const commandSeparator = "_";

/**
 * コマンドマネージャー
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export class CommandManager extends LogEmitter<{}> {
  private static _instance: CommandManager | null = null;

  /**
   * コマンドマネージャーの唯一のインスタンスを返します
   */
  static get instance(){
    return this._instance ??= new CommandManager();
  }

  private readonly _commands: BaseCommand[];
  /** コマンドを返します */
  get commands(): Readonly<BaseCommand[]>{
    return this._commands;
  }

  private _subCommandNames: Set<string>;
  /** サブコマンドがあるコマンドの一覧を返します */
  get subCommandNames(): Readonly<Set<string>>{
    return this._subCommandNames;
  }

  private commandMap: Map<string, BaseCommand>;

  private constructor(){
    super("CommandsManager");
    this.logger.trace("Initializing");

    this._commands = (require("../Commands/_index") as typeof import("../Commands/_index")).default.filter(n => !n.disabled);

    this.initializeMap({ reportDupes: getConfig().debug });
    this.initializeSubcommandNames();

    this.logger.trace("Initialized");
  }

  private initializeMap({ reportDupes }: { reportDupes: boolean }){
    const sets = new Map<string, BaseCommand>();

    const setCommand = (name: string, command: BaseCommand) => {
      if(sets.has(name) && reportDupes && !command.interactionOnly){
        this.logger.warn(`Detected command ${command.name} the duplicated key ${name} with ${sets.get(name)!.name}; overwriting`);
      }
      sets.set(name, command);
    };

    this.commands.forEach(command => {
      setCommand(command.name, command);
      command.alias.forEach(name => setCommand(name, command));
    });

    this.commandMap = sets;
  }

  private initializeSubcommandNames(){
    this._subCommandNames = new Set(
      this.commands
        .filter(command => command.asciiName.includes(">"))
        .map(command => command.asciiName.split(">")[0])
    );
  }

  /**
   * コマンド名でコマンドを解決します
   * @param command コマンド名
   * @returns 解決されたコマンド
   */
  resolve(command: string){
    const result = this.commandMap.get(command.toLowerCase());
    if(result){
      this.logger.info(`Command "${command}" was resolved successfully`);
    }else{
      this.logger.info("Command not found");
    }

    return result;
  }

  @measureTime
  async sync(client: Readonly<Client>, removeOutdated: boolean = false){
    if(process.env.DISABLE_SYNC_SC && !removeOutdated){
      this.logger.info("Skip syncing commands");
      return;
    }

    this.logger.info("Start syncing application commands");

    // format local commands into the api-compatible well-formatted ones
    const apiCompatibleCommands: CreateApplicationCommandOptions[] = this.groupSubcommands(
      this.commands
        .filter(command => !command.unlist)
        .flatMap(command => command.toApplicationCommandStructure())
        .map(command => this.apiToApplicationCommand(command as unknown as AnyApplicationCommand) as CreateApplicationCommandOptions)
    );

    // Get registered commands
    const registeredAppCommands = await client.application.getGlobalCommands({ withLocalizations: true });

    this.logger.info(`Successfully get ${registeredAppCommands.length} commands registered.`);

    const commandsToEdit = await this.filterCommandsToBeEdited(apiCompatibleCommands, registeredAppCommands);
    const commandsToAdd = await this.filterCommandsToBeAdded(apiCompatibleCommands, registeredAppCommands);
    const commandsToRemove = await this.filterCommandsToBeRemoved(apiCompatibleCommands, registeredAppCommands);

    // if the app has the known commands or has no command and there are too many diffs, bulk-registering them
    if(commandsToEdit.length + commandsToAdd.length > 3 && (registeredAppCommands.length === 0 || commandsToRemove.length === 0)){
      this.logger.info("Bulk-registering application-commands");
      await client.application.bulkEditGlobalCommands(apiCompatibleCommands);
      this.logger.info("Successfully registered");
      return;
    }

    // if there are any commands that should be added or updated
    if(commandsToEdit.length > 0 || commandsToAdd.length > 0){
      this.logger.info(`Detected ${commandsToEdit.length + commandsToAdd.length} commands that should be updated; updating`);
      this.logger.info([...commandsToEdit, ...commandsToAdd].map(command => command.name));
      for(let i = 0; i < commandsToEdit.length; i++){
        const commandToRegister = commandsToEdit[i];
        const id = registeredAppCommands.find(cmd => cmd.type === commandToRegister.type && cmd.name === commandToRegister.name)!.id;
        await client.application.editGlobalCommand(id, commandToRegister);
        this.logger.info(`editing ${Math.floor((i + 1) / commandsToEdit.length * 1000) / 10}% completed`);
      }
      for(let i = 0; i < commandsToAdd.length; i++){
        const commandToRegister = commandsToAdd[i];
        await client.application.createGlobalCommand(commandToRegister);
        this.logger.info(`adding ${Math.floor((i + 1) / commandsToAdd.length * 1000) / 10}% completed`);
      }
      this.logger.info("Updating succeeded.");
    }else{
      this.logger.info("Detected no command that should be updated");
    }

    // remove outdated commands (which are not recognized as the bot's command)
    if(removeOutdated){
      if(commandsToRemove.length > 0){
        this.logger.info(`Detected ${commandsToRemove.length} commands that should be removed; removing...`);
        this.logger.info(commandsToRemove.map(command => command.name));
        await client.application.bulkEditGlobalCommands(apiCompatibleCommands);
        this.logger.info("Removal succeeded.");
      }else{
        this.logger.info("Detected no command that should be removed");
      }
    }
  }

  private async filterCommandsToBeEdited(
    apiCompatibleCommands: CreateApplicationCommandOptions[],
    registeredAppCommands: AnyApplicationCommand[],
  ){
    return apiCompatibleCommands.filter(expected => {
      if(expected.type === ApplicationCommandTypes.CHAT_INPUT){
        const actual = registeredAppCommands.find(
          command => command.type === ApplicationCommandTypes.CHAT_INPUT && command.name === expected.name
        ) as ChatInputApplicationCommand;

        if(!actual){
          return false;
        }else{
          return !this.isSameCommand(actual, expected);
        }
      }else if(expected.type === ApplicationCommandTypes.MESSAGE){
        const actual = registeredAppCommands.find(
          command => command.type === ApplicationCommandTypes.MESSAGE && command.name === expected.name
        ) as MessageApplicationCommand;

        if(!actual){
          return false;
        }else{
          return !this.isSameCommand(actual, expected);
        }
      }else{
        return false;
      }
    });
  }

  private async filterCommandsToBeAdded(
    apiCompatibleCommands: CreateApplicationCommandOptions[],
    registeredAppCommands: AnyApplicationCommand[],
  ){
    return apiCompatibleCommands.filter(expected => {
      if(expected.type === ApplicationCommandTypes.CHAT_INPUT){
        return !registeredAppCommands.some(
          reg => reg.type === ApplicationCommandTypes.CHAT_INPUT && reg.name === expected.name
        );
      }else if(expected.type === ApplicationCommandTypes.MESSAGE){
        return !registeredAppCommands.some(
          reg => reg.type === ApplicationCommandTypes.MESSAGE && reg.name === expected.name
        );
      }else{
        return false;
      }
    });
  }

  private async filterCommandsToBeRemoved(
    apiCompatibleCommands: CreateApplicationCommandOptions[],
    registeredAppCommands: AnyApplicationCommand[],
  ){
    return registeredAppCommands.filter(registered => {
      const index = apiCompatibleCommands.findIndex(command =>registered.type === command.type && registered.name === command.name);
      return index < 0;
    });
  }

  async removeAllApplicationCommand(client: Readonly<Client>){
    this.logger.info("Removing all application commands");
    await client.application.bulkEditGlobalCommands([]);
    this.logger.info("Successfully removed all application commands");
  }

  async removeAllGuildCommand(client: Readonly<Client>, guildId: string){
    this.logger.info("Removing all guild commands of " + guildId);
    await client.application.bulkEditGuildCommands(guildId, []);
    this.logger.info("Successfully removed all guild commands");
  }

  isSameCommand(actual: ChatInputApplicationCommand | MessageApplicationCommand, expected: CreateApplicationCommandOptions): boolean{
    return util.isDeepStrictEqual(
      this.apiToApplicationCommand(actual),
      expected
    );
  }

  protected apiToApplicationCommand(apiCommand: AnyApplicationCommand) {
    const defaultMemberPermissions
      = apiCommand.defaultMemberPermissions && typeof apiCommand.defaultMemberPermissions === "object"
        ? apiCommand.defaultMemberPermissions.allow.toString()
        : apiCommand.defaultMemberPermissions as unknown as string;

    if(apiCommand.type === ApplicationCommandTypes.MESSAGE){
      return {
        type: apiCommand.type,
        name: apiCommand.name,
        nameLocalizations: apiCommand.nameLocalizations,
        defaultMemberPermissions,
      };
    }else if(apiCommand.options){
      const optionMapper = (option: ApplicationCommandOptions) => {
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
              nameLocalizations: choice.nameLocalizations || choice.name_localizations || null,
              // @ts-expect-error
              name_localizations: choice.nameLocalizations || choice.name_localizations || null,
            })),
          };
        }else{
          return {
            type: option.type,
            name: option.name,
            description: option.description,
            descriptionLocalizations: option.descriptionLocalizations,
            required: !!option.required,
            autocomplete: "autocomplete" in option && option.autocomplete || false,
          };
        }
      };

      return {
        type: apiCommand.type,
        name: apiCommand.name,
        description: apiCommand.description,
        descriptionLocalizations: apiCommand.descriptionLocalizations || {},
        defaultMemberPermissions,
        options: apiCommand.options.map(option => {
          if(option.type === ApplicationCommandOptionTypes.SUB_COMMAND){
            return {
              description: option.description,
              descriptionLocalizations: option.descriptionLocalizations || {},
              name: option.name,
              type: option.type,
              options: option.options?.map(optionMapper),
            };
          }else{
            return optionMapper(option);
          }
        }),
      };
    }else{
      return {
        type: apiCommand.type,
        name: apiCommand.name,
        description: apiCommand.description,
        descriptionLocalizations: apiCommand.descriptionLocalizations,
        defaultMemberPermissions,
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

  /**サブコマンドをグループ化します。現時点では、ネストは一段階のみ対応しています。 */
  protected groupSubcommands(commands: CreateApplicationCommandOptions[]): CreateApplicationCommandOptions[] {
    const subcommandGroups = new Map<string, { from: CreateChatInputApplicationCommandOptions[], to: CreateChatInputApplicationCommandOptions | null }>();

    const normalCommands = commands.filter(c => {
      if(!c.name.includes(subCommandSeparator) || c.type !== ApplicationCommandTypes.CHAT_INPUT){
        return true;
      }

      const baseName = c.name.split(subCommandSeparator)[0];

      if(subcommandGroups.has(baseName)){
        subcommandGroups.get(baseName)!.from.push(c);
      }else{
        subcommandGroups.set(baseName, { from: [c], to: null });
      }

      return false;
    });

    for(const key of subcommandGroups.keys()){
      const group = subcommandGroups.get(key)!;

      if(group.from.some(c => c.name === key)){
        throw new Error("Top level command that has subcommands cannot be command itself.");
      }

      if(!group.to){
        group.to = {
          type: ApplicationCommandTypes.CHAT_INPUT,
          name: key,
          description: i18next.t(`commands:${key}.description` as any),
          defaultMemberPermissions: group.from[0].defaultMemberPermissions,
          descriptionLocalizations: {},
          options: [],
        };

        availableLanguages().forEach(language => {
          if(i18next.language === language) return;
          const localized: string = i18next.t(`commands:${key}.description` as any, { lng: language }).substring(0, 100);
          if(localized === group.to!.description) return;
          group.to!.descriptionLocalizations![language as Locale] = localized.trim();
        });
      }

      group.from.forEach(command => {
        const subcommand: ApplicationCommandOptionsSubCommand = {
          type: ApplicationCommandOptionTypes.SUB_COMMAND,
          name: command.name.substring(key.length + 1),
          description: command.description,
          descriptionLocalizations: command.descriptionLocalizations || {},
          options: command.options as ApplicationCommandOptionsWithValue[],
        };

        group.to!.options!.push(subcommand);
      });
    }

    return [...normalCommands, ...[...subcommandGroups.values()].map(d => d.to!)];
  }
}
