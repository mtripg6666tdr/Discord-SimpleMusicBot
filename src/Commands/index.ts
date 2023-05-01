import type Commands from "./commands";
import type { PageToggle } from "../Component/PageToggle";
import type { MusicBot } from "../bot";
import type { CancellationPending, GuildVoiceInfo } from "../definition";
import type { Client, Message } from "discord.js";

import * as fs from "fs";
import * as path from "path";


export interface CommandInterface {
  run: (message: Message, options: CommandArgs) => Promise<void>;
  name: string;
  alias: string[];
  description?: string;
  unlist: boolean;
  examples?: string;
  usage?: string;
  category?: string;
}

export interface CommandArgs {
  bot: MusicBot;
  data: { [key: string]: GuildVoiceInfo };
  rawArgs: string;
  args: string[];
  updateBoundChannel: (message: Message) => void;
  EmbedPageToggle: PageToggle[];
  client: Client;
  Join: (message: Message) => Promise<boolean>;
  PlayFromURL: (message: Message, optiont: string, first: boolean) => Promise<void>;
  initData: (guildid: string, channelid: string) => void;
  cancellations: CancellationPending[];
}

export class Command {
  private static _instance = null as Command;
  static get Instance(){
    if(this._instance) return this._instance;
    else return this._instance = new Command();
  }

  private readonly commands = null as CommandInterface[];

  private constructor(){
    this.commands = [];
    fs.readdirSync(__dirname, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name)
      .filter(n => n.endsWith(".js") && n !== "index.js")
      .map(n => n.slice(0, -3))
      .forEach(n => {
        const cp = new (require(path.join(__dirname, n)).Default)() as CommandInterface;
        this.commands.push(cp);
        if(cp.name === "コマンド"){
          (cp as Commands).commands = this.commands;
        }
        return cp;
      });
  }

  resolve(command: string){
    for(let i = 0; i < this.commands.length; i++){
      if(this.commands[i].name === command || this.commands[i].alias.includes(command)){
        return this.commands[i];
      }
    }
    return null;
  }
}
