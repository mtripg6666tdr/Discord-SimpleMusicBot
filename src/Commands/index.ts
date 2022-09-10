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

import type { CommandMessage } from "../Component/CommandMessage";
import type { ListCommandInitializeOptions, UnlistCommandInitializeOptions, ListCommandWithArgumentsInitializeOptions, CommandArgs, SlashCommandArgument } from "../Structure/Command";

export { CommandArgs } from "../Structure/Command";

/**
 * すべてのコマンドハンドラーの基底クラスです
 */
export abstract class BaseCommand {
  abstract run(message:CommandMessage, options:CommandArgs):Promise<void>;
  public readonly _name: string;
  public get name(){return this._name;}
  public readonly _alias: Readonly<string[]>;
  public get alias(){return this._alias;}
  public readonly _description: string = null;
  public get description(){return this._description;}
  public readonly _unlist: boolean;
  public get unlist(){return this._unlist;}
  public readonly _examples: string = null;
  public get examples(){return this._examples;}
  public readonly _usage: string = null;
  public get usage(){return this._usage;}
  public readonly _category:string = null;
  public get category(){return this._category;}
  public readonly _argument:Readonly<SlashCommandArgument[]> = null;
  public get argument(){return this._argument;}

  constructor(opts:ListCommandInitializeOptions|UnlistCommandInitializeOptions){
    this._name = opts.name;
    this._alias = opts.alias;
    this._unlist = opts.unlist;
    if(!this._unlist){
      const { description, examples, usage, category, argument } = opts as ListCommandWithArgumentsInitializeOptions;
      this._description = description;
      this._examples = examples || null;
      this._usage = usage || null;
      this._category = category;
      this._argument = argument || null;
    }
  }
}
