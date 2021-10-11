import { Client } from "discord.js";
import * as fs from "fs";
import * as path from "path";
import { MusicBot } from "../bot";
import { CommandMessage } from "../Component/CommandMessage"
import { PageToggle } from "../Component/PageToggle";
import { GuildDataContainer } from "../definition";
import { TaskCancellationManager } from "../Component/TaskCancellationManager";
import Commands from "./commands";
import { log } from "../Util";

/**
 * すべてのコマンドの規定インターフェースです
 */
export interface CommandInterface {
  run(message:CommandMessage, options:CommandArgs):Promise<void>;
  name: string;
  alias: string[];
  description?: string;
  unlist: boolean;
  examples?: string;
  usage?: string;
  category?:string;
  argument?:SlashCommandArgument[]
}

/**
 * スラッシュコマンドの引数として取れるものを定義するインターフェースです
 */
export interface SlashCommandArgument {
  type:"bool"|"integer"|"string",
  name:string,
  description:string,
  required:boolean
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
  Join(message:CommandMessage, reply?:boolean):Promise<boolean>;
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
export class CommandsManager {
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

  private commands = null as CommandInterface[];

  private constructor(){
    log("[CommandsManager]Initializing");
    this.commands = [];
      fs.readdirSync(__dirname, {withFileTypes: true})
      .filter(d => d.isFile())
      .map(d => d.name)
      .filter(n => n.endsWith(".js") && n !== "index.js")
      .map(n => n.slice(0, -3))
      .forEach(n => {
        const cp = new (require(path.join(__dirname, n)).default)() as CommandInterface;
        this.commands.push(cp);
        return cp;
      });
    log("[CommandsManager]Initialized");
  }

  /**
   * コマンド名でコマンドを解決します
   * @param command コマンド名
   * @returns 解決されたコマンド
   */
  resolve(command:string){
    log("[CommandsManager]Resolve() called");
    let result = null;
    for(let i = 0; i < this.commands.length; i++){
      if(this.commands[i].name === command || this.commands[i].alias.indexOf(command) >= 0){
        result = this.commands[i];
        break;
      }
    }
    if(result)
      log("[CommandsManager]Command `" + command + "` was resolved successfully");
    else
      log("[CommandsManager]Command not found");
    return result;
  }

  Check(){
    return true;
  }
}