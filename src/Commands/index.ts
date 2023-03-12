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

import type { CommandMessage } from "../Component/commandResolver/CommandMessage";
import type { ListCommandInitializeOptions, UnlistCommandOptions, ListCommandWithArgsOptions, CommandArgs, CommandPermission, LocalizedSlashCommandArgument } from "../Structure/Command";
import type { LoggerObject } from "../logger";
import type { ApplicationCommandOptionsBoolean, ApplicationCommandOptionsChoice, ApplicationCommandOptionsInteger, ApplicationCommandOptionsString, CreateApplicationCommandOptions, LocaleMap } from "oceanic.js";

import i18next from "i18next";
import { TypedEmitter } from "oceanic.js";
import { ApplicationCommandTypes } from "oceanic.js";

import { CommandManager } from "../Component/CommandManager";
import { permissionDescriptionParts } from "../Structure/Command";
import { discordUtil } from "../Util";
import { getLogger } from "../logger";

export { CommandArgs } from "../Structure/Command";

interface CommandEvents {
  run: [Readonly<CommandArgs>];
}

/**
 * すべてのコマンドハンドラーの基底クラスです
 */
export abstract class BaseCommand extends TypedEmitter<CommandEvents> {
  protected abstract run(message: CommandMessage, options: Readonly<CommandArgs>): Promise<void>;

  protected readonly _name: string;
  public get name(){
    return this._name;
  }

  protected readonly _alias: Readonly<string[]>;
  public get alias(){
    return this._alias;
  }

  protected readonly _description: string = null;
  public get description(){
    return this._description;
  }

  protected readonly _unlist: boolean;
  public get unlist(){
    return this._unlist;
  }

  protected readonly _examples: LocaleMap = null;
  public get examples(){
    return this._examples;
  }

  protected readonly _usage: LocaleMap = null;
  public get usage(){
    return this._usage;
  }

  protected readonly _category: string = null;
  public get category(){
    return this._category;
  }

  protected readonly _shouldDefer: boolean = false;
  public get shouldDefer(){
    return this._shouldDefer;
  }

  protected readonly _argument: Readonly<LocalizedSlashCommandArgument[]> = null;
  public get argument(){
    return this._argument;
  }

  get asciiName(){
    return this.alias.filter(c => c.match(/^[\w-]{2,32}$/))[0];
  }

  protected readonly _requiredPermissionsOr: CommandPermission[] = null;
  public get requiredPermissionsOr(){
    return this._requiredPermissionsOr || [];
  }

  get permissionDescription(){
    const perms = this.requiredPermissionsOr.filter(perm => perm !== "admin");
    if(perms.length === 0){
      return "なし";
    }else{
      return `${perms.map(permission => permissionDescriptionParts[permission]).join("、")}${perms.length > 1 ? "のいずれか" : ""}`;
    }
  }

  protected readonly _descriptionLocalization: LocaleMap = null;

  get descriptionLocalization(){
    return this._descriptionLocalization;
  }

  protected readonly logger: LoggerObject;

  constructor(opts: ListCommandInitializeOptions|UnlistCommandOptions){
    super();
    this._alias = opts.alias;
    this._name = "name" in opts ? opts.name : i18next.t(`commands:${this.asciiName}.name`);
    this._unlist = opts.unlist;
    this._shouldDefer = opts.shouldDefer;
    if(!this._unlist){
      if(!this.asciiName) throw new Error("Command has not ascii name");
      const {
        examples,
        usage,
        category,
        argument,
        requiredPermissionsOr,
      } = opts as ListCommandWithArgsOptions;

      this._description = i18next.t(`commands:${this.asciiName}.description`);
      this._descriptionLocalization = Object.create({});
      i18next.languages.forEach(language => {
        if(i18next.language === language) return;
        this._descriptionLocalization[language as keyof typeof this._descriptionLocalization]
          = i18next.t(`commands:${this.asciiName}.description`, { lng: language });
      });

      this._examples = examples ? Object.create(null) : null;
      if(this._examples){
        i18next.languages.forEach(language => {
          this._examples[language as keyof typeof this._examples]
            = i18next.t(`commands:${this.asciiName}.examples`, { lng: language });
        });
      }

      this._usage = usage ? Object.create(null) : null;
      if(this._usage){
        i18next.languages.forEach(language => {
          this._usage[language as keyof typeof this._usage]
            = i18next.t(`commands:${this.asciiName}.usage`, { lng: language });
        });
      }

      this._category = category;

      this._argument = argument ? argument.map(arg => {
        const result = {
          type: arg.type,
          name: arg.name,
          required: arg.required || false,
          description: i18next.t(`commands:${this.asciiName}.args.${arg.name}.description`),
          descriptionLocalization: Object.create(null),
          choices: [] as LocalizedSlashCommandArgument["choices"],
        };
        i18next.languages.forEach(language => {
          result.descriptionLocalization[language as keyof typeof result.descriptionLocalization]
            = i18next.t(`commands:${this.asciiName}.args.${arg.name}.description`, { lng: language });
        });

        arg.choices.forEach(choiceValue => {
          const resultChoice = {
            name: i18next.t(`commands:${this.asciiName}.args.${arg.name}.choices.${choiceValue}`),
            value: choiceValue,
            nameLocalizations: Object.create(null),
          };
          i18next.languages.forEach(language => {
            resultChoice.nameLocalizations[language as keyof LocaleMap]
              = i18next.t(`commands:${this.asciiName}.args.${arg.name}.choices.${choiceValue}`, { lng: language });
          });
        });

        if(arg.choices.length === 0){
          delete arg.choices;
        }

        return result;
      }) : null;

      this._requiredPermissionsOr = requiredPermissionsOr || [];
    }
    this.logger = getLogger(`Command(${this.asciiName})`);
    this.logger.debug(`${this.name} loaded`);
  }

  async checkAndRun(message: CommandMessage, options: Readonly<CommandArgs>){
    const judgeIfPermissionMeeted = (perm: CommandPermission) => {
      if(perm === "admin"){
        return discordUtil.users.isPrivileged(message.member);
      }else if(perm === "dj"){
        return discordUtil.users.isDJ(message.member, options);
      }else if(perm === "manageGuild"){
        return message.member.permissions.has("MANAGE_GUILD");
      }else if(perm === "manageMessages"){
        return message.channel.permissionsOf(message.member).has("MANAGE_MESSAGES");
      }else if(perm === "noConnection"){
        return !options.server.player.isConnecting;
      }else if(perm === "onlyListener"){
        return discordUtil.channels.isOnlyListener(message.member, options);
      }else if(perm === "sameVc"){
        return discordUtil.channels.sameVC(message.member, options);
      }else{
        return false;
      }
    };
    if(this.requiredPermissionsOr.length !== 0 && !this.requiredPermissionsOr.some(judgeIfPermissionMeeted)){
      await message.reply({
        content: `この操作を実行するには、${this.permissionDescription}が必要です。`,
        ephemeral: true,
      });
      return;
    }
    this.emit("run", options);
    await this.run(message, options);
  }

  toApplicationCommandStructure(): CreateApplicationCommandOptions {
    if(this.unlist) throw new Error("This command cannot be listed due to private command!");
    const options = this.argument?.map(arg => {
      const discordCommandStruct = {
        type: CommandManager.mapCommandOptionTypeToInteger(arg.type),
        name: arg.name,
        description: arg.description.replace(/\r/g, "").replace(/\n/g, ""),
        description_localizations: arg.descriptionLocalization,
        required: arg.required,
        choices: arg.choices.map(choice => ({
          name: choice.name,
          value: choice.value,
          nameLocalizations: choice.nameLocalizations,
        })) as ApplicationCommandOptionsChoice[],
      };
      if(!discordCommandStruct.choices) delete discordCommandStruct.choices;
      return discordCommandStruct as ApplicationCommandOptionsString | ApplicationCommandOptionsInteger | ApplicationCommandOptionsBoolean;
    });
    if(options && options.length > 0){
      return {
        type: ApplicationCommandTypes.CHAT_INPUT,
        name: this.asciiName,
        description: this.description.replace(/\r/g, "").replace(/\n/g, ""),
        descriptionLocalizations: this.descriptionLocalization,
        options,
      };
    }else{
      return {
        type: ApplicationCommandTypes.CHAT_INPUT,
        name: this.asciiName,
        description: this.description.replace(/\r/g, "").replace(/\n/g, ""),
        descriptionLocalizations: this.descriptionLocalization,
      };
    }
  }
}
