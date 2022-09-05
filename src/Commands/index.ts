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
import type { PageToggle } from "../Component/PageToggle";
import type { GuildDataContainer } from "../Structure";
import type { MusicBot } from "../bot";
import type { categories } from "./commands";
import type { Client } from "eris";

import * as fs from "fs";
import * as path from "path";

import { LogEmitter } from "../Structure";

type BaseCommandInitializeOptions = {
  name:string,
  alias:Readonly<string[]>,
};

type ListCommandWithArgumentsInitializeOptions = BaseCommandInitializeOptions & {
  description:string,
  unlist:boolean,
  examples:string,
  usage:string,
  category:keyof typeof categories,
  argument:SlashCommandArgument[],
};

type ListCommandWithoutArgumentsInitializeOptions = BaseCommandInitializeOptions & {
  description:string,
  unlist:false,
  category:keyof typeof categories,
};

type ListCommandInitializeOptions = ListCommandWithArgumentsInitializeOptions | ListCommandWithoutArgumentsInitializeOptions;

type UnlistCommandInitializeOptions = BaseCommandInitializeOptions & {
  unlist:true,
};

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

/**
 * スラッシュコマンドの引数として取れるものを定義するインターフェースです
 */
export interface SlashCommandArgument {
  type:"bool"|"integer"|"string";
  name:string;
  description:string;
  required:boolean;
  choices?:{[key:string]:string|number};
}

/**
 * コマンドのランナに渡される引数
 */
export interface CommandArgs {
  /**
   * ボットのインスタンス
   */
  bot:MusicBot;
  /**
   * ボットのサーバーデータ
   */
  server:GuildDataContainer;
  /**
   * コマンドの生の引数
   */
  rawArgs: string;
  /**
   * コマンドのパース済み引数
   */
  args: string[];
  /**
   * 生存しているPageToggleの配列
   */
  embedPageToggle:PageToggle[];
  /**
   * ボットのクライアント
   */
  client:Client;
  /**
   * サーバーデータの初期化関数
   * @param guildid サーバーID
   * @param channelid チャンネルID
   */
  initData: (guildid:string, channelid:string) => void;
}

/**
 * コマンドマネージャー
 */
export class CommandsManager extends LogEmitter {
  private static _instance = null as CommandsManager;
  /**
   * コマンドマネージャーの唯一のインスタンスを返します
   */
  static get Instance(){
    if(this._instance) return this._instance;
    else return this._instance = new CommandsManager();
  }

  /**
   * コマンドマネージャーの唯一のインスタンスを返します
   */
  get Commands(){
    return this.commands;
  }

  private readonly commands = null as BaseCommand[];

  private constructor(){
    super();
    this.SetTag("CommandsManager");
    this.Log("Initializing");
    this.commands = [];
    fs.readdirSync(__dirname, {withFileTypes: true})
      .filter(d => d.isFile())
      .map(d => d.name)
      .filter(n => n.endsWith(".js") && n !== "index.js")
      .map(n => n.slice(0, -3))
      .forEach(n => {
        // eslint-disable-next-line new-cap
        const cp = new (require(path.join(__dirname, n)).default)() as BaseCommand;
        this.commands.push(cp);
        return cp;
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
    for(let i = 0; i < this.commands.length; i++){
      if(this.commands[i].name === command || this.commands[i].alias.includes(command)){
        result = this.commands[i];
        break;
      }
    }
    if(result) this.Log(`Command "${command}" was resolved successfully`);
    else this.Log("Command not found");
    return result;
  }

  Check(){
    return true;
  }
}
