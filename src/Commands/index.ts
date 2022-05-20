import type { Client } from "discord.js";
import type { MusicBot } from "../bot";
import type { CommandMessage } from "../Component/CommandMessage"
import type { PageToggle } from "../Component/PageToggle";
import type { TaskCancellationManager } from "../Component/TaskCancellationManager";
import type { categories } from "./commands";

import * as fs from "fs";
import * as path from "path";
import { LogEmitter, GuildDataContainer } from "../Structure";

type BaseCommandInitializeOptions = {
  name:string,
  alias:Readonly<string[]>,
}

type ListCommandWithArgumentsInitializeOptions = BaseCommandInitializeOptions & {
  description:string,
  unlist:boolean,
  examples:string,
  usage:string,
  category:keyof typeof categories,
  argument:SlashCommandArgument[],
}

type ListCommandWithoutArgumentsInitializeOptions = BaseCommandInitializeOptions & {
  description:string,
  unlist:false,
  category:keyof typeof categories,
}

type ListCommandInitializeOptions = ListCommandWithArgumentsInitializeOptions | ListCommandWithoutArgumentsInitializeOptions;

type UnlistCommandInitializeOptions = BaseCommandInitializeOptions & {
  unlist:true,
}

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
  type:"bool"|"integer"|"string",
  name:string,
  description:string,
  required:boolean,
  choices?:{[key:string]:string|number},
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
  data:{[key:string]:GuildDataContainer};
  /**
   * コマンドの生の引数
   */
  rawArgs: string;
  /**
   * コマンドのパース済み引数
   */
  args: string[];
  /**
   * 紐づけチャンネルの更新関数
   * @param message 更新に使うコマンドメッセージ
   */
  updateBoundChannel(message:CommandMessage):void;
  /**
   * 生存しているPageToggleの配列
   */
  EmbedPageToggle:PageToggle[];
  /**
   * ボットのクライアント
   */
  client:Client;
  /**
   * VC参加関数
   * @param message 参加に使うメッセージ
   * @param reply メッセージに返信するかどうか
   */
  JoinVoiceChannel(message:CommandMessage, reply?:boolean, replyOnFail?:boolean):Promise<boolean>;
  /**
   * URLからキューに追加する関数
   * @param message 追加に使うメッセージ
   * @param optiont URL
   * @param first 最初に追加するかどうか
   */
  PlayFromURL(message:CommandMessage, optiont:string, first:boolean):Promise<void>;
  /**
   * サーバーデータの初期化関数
   * @param guildid サーバーID
   * @param channelid チャンネルID
   */
  initData(guildid:string, channelid:string):void;
  /**
   * キャンセルマネージャー
   */
  cancellations:TaskCancellationManager[];
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

  private commands = null as BaseCommand[];

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
    this.Log("Resolve() called");
    let result = null;
    for(let i = 0; i < this.commands.length; i++){
      if(this.commands[i].name === command || this.commands[i].alias.indexOf(command) >= 0){
        result = this.commands[i];
        break;
      }
    }
    if(result)
      this.Log("Command `" + command + "` was resolved successfully");
    else
      this.Log("Command not found");
    return result;
  }

  Check(){
    return true;
  }
}