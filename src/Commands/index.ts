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

import type { CommandMessage } from "../Component/CommandMessage";
import type {
  ListCommandInitializeOptions,
  UnlistCommandInitializeOptions,
  ListCommandWithArgumentsInitializeOptions,
  CommandArgs,
  SlashCommandArgument,
  CommandPermission,
} from "../Structure/Command";
import type {
  ApplicationCommandOptionsBoolean,
  ApplicationCommandOptionsInteger,
  ApplicationCommandOptionsString,
} from "eris";

import { Constants } from "eris";

import { CommandManager } from "../Component/CommandManager";
import { permissionDescriptionParts } from "../Structure/Command";
import Util from "../Util";

export { CommandArgs } from "../Structure/Command";

/**
 * すべてのコマンドハンドラーの基底クラスです
 */
export abstract class BaseCommand {
  protected abstract run(message: CommandMessage, options: Readonly<CommandArgs>): Promise<void>;

  protected readonly _name: string;
  public get name() {
    return this._name;
  }

  protected readonly _alias: Readonly<string[]>;
  public get alias() {
    return this._alias;
  }

  protected readonly _description: string = null;
  public get description() {
    return this._description;
  }

  protected readonly _unlist: boolean;
  public get unlist() {
    return this._unlist;
  }

  protected readonly _examples: string = null;
  public get examples() {
    return this._examples;
  }

  protected readonly _usage: string = null;
  public get usage() {
    return this._usage;
  }

  protected readonly _category: string = null;
  public get category() {
    return this._category;
  }

  protected readonly _shouldDefer: boolean = false;
  public get shouldDefer() {
    return this._shouldDefer;
  }

  protected readonly _argument: Readonly<SlashCommandArgument[]> = null;
  public get argument() {
    return this._argument;
  }

  get asciiName() {
    return this.alias.filter(c => c.match(/^[\w-]{2,32}$/))[0];
  }

  protected readonly _requiredPermissionsOr: CommandPermission[] = null;
  public get requiredPermissionsOr() {
    return this._requiredPermissionsOr || [];
  }

  get permissionDescription() {
    const perms = this.requiredPermissionsOr.filter(perm => perm !== "admin");
    if(perms.length === 0){
      return "なし";
    }else{
      return `${perms.map(permission => permissionDescriptionParts[permission]).join("、")}${
        perms.length > 1 ? "のいずれか" : ""
      }`;
    }
  }

  constructor(opts: ListCommandInitializeOptions | UnlistCommandInitializeOptions) {
    this._name = opts.name;
    this._alias = opts.alias;
    this._unlist = opts.unlist;
    this._shouldDefer = opts.shouldDefer;
    if(!this._unlist){
      if(!this.asciiName) throw new Error("Command has not ascii name");
      const { description, examples, usage, category, argument, requiredPermissionsOr } =
        opts as ListCommandWithArgumentsInitializeOptions;
      this._description = description;
      this._examples = examples || null;
      this._usage = usage || null;
      this._category = category;
      this._argument = argument || null;
      this._requiredPermissionsOr = requiredPermissionsOr || [];
    }
  }

  async checkAndRun(message: CommandMessage, options: Readonly<CommandArgs>) {
    const judgeIfPermissionMeeted = (perm: CommandPermission) => {
      if(perm === "admin"){
        return Util.eris.user.isPrivileged(message.member);
      }else if(perm === "dj"){
        return Util.eris.user.isDJ(message.member, options);
      }else if(perm === "manageGuild"){
        return message.member.permissions.has("manageGuild");
      }else if(perm === "manageMessages"){
        return message.channel.permissionsOf(message.member).has("manageMessages");
      }else if(perm === "noConnection"){
        return !options.server.player.isConnecting;
      }else if(perm === "onlyListener"){
        return Util.eris.channel.isOnlyListener(message.member, options);
      }else if(perm === "sameVc"){
        return Util.eris.channel.sameVC(message.member, options);
      }else{
        return false;
      }
    };
    if(
      this.requiredPermissionsOr.length !== 0 &&
      !this.requiredPermissionsOr.some(judgeIfPermissionMeeted)
    ){
      await message.reply({
        content: `この操作を実行するには、${this.permissionDescription}が必要です。`,
        ephemeral: true,
      });
      return;
    }
    await this.run(message, options);
  }

  toApplicationCommandStructure() {
    if(this.unlist) throw new Error("This command cannot be listed due to private command!");
    const options = this.argument?.map(arg => {
      const erisCommandStruct = {
        type: CommandManager.mapCommandOptionTypeToInteger(arg.type),
        name: arg.name,
        description: arg.description.replace(/\r/g, "").replace(/\n/g, ""),
        required: arg.required,
        choices: !arg.choices
          ? undefined
          : Object.keys(arg.choices).map(name => ({
              name,
              value: arg.choices[name],
            })),
      };
      if(!erisCommandStruct.choices) delete erisCommandStruct.choices;
      return erisCommandStruct as
        | ApplicationCommandOptionsString
        | ApplicationCommandOptionsInteger
        | ApplicationCommandOptionsBoolean;
    });
    if(options && options.length > 0){
      return {
        type: Constants.ApplicationCommandTypes.CHAT_INPUT,
        name: this.asciiName,
        description: this.description,
        options,
      };
    }else{
      return {
        type: Constants.ApplicationCommandTypes.CHAT_INPUT,
        name: this.asciiName,
        description: this.description,
      };
    }
  }
}
