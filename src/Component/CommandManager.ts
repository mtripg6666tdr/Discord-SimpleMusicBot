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

import type { BaseCommand } from "../Commands";

import * as fs from "fs";
import * as path from "path";

import { LogEmitter } from "../Structure";

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
    this.setTag("CommandsManager");
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
