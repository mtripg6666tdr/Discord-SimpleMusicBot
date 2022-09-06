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

import * as fs from "fs";
import * as path from "path";
import { isMainThread } from "worker_threads";

import * as config from "./config";
import { StringifyObject } from "./general";

export type LogLevels = "log"|"warn"|"error"|"debug";
export type LoggerType = (content:string, level?:LogLevels)=>void;

class LogStore {
  private readonly loggingStream = null as fs.WriteStream;
  
  constructor(){
    if(config.debug && isMainThread){
      const dirPath = "../../logs";
      if(!fs.existsSync(path.join(__dirname, dirPath))){
        fs.mkdirSync(path.join(__dirname, dirPath));
      }
      this.loggingStream = fs.createWriteStream(path.join(__dirname, `${dirPath}/log-${Date.now()}.log`));
      const onExit = () => {
        if(!this.loggingStream.destroyed){
          this.loggingStream.write(Buffer.from(`INFO  ${new Date().toISOString()} [Logger] detect process exiting, closing stream...`));
          this.loggingStream.destroy();
        }
      };
      process.on("exit", onExit);
      process.on("SIGINT", onExit);
    }
  }

  log:boolean = true;
  maxLength = 30;
  private readonly _data:string[] = [];
  get data():Readonly<LogStore["_data"]>{
    return this._data;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-shadow
  addLog(level:LogLevels, log:string){
    if(level !== "debug"){
      this._data.push(`${level[0].toUpperCase()}:${log}`);
      if(this.data.length > this.maxLength){
        this._data.shift();
      }
    }
    if(typeof log !== "string"){
      log = StringifyObject(log);
    }
    if(this.loggingStream && !this.loggingStream.destroyed){
      this.loggingStream.write(Buffer.from(`${{
        "log": "INFO ",
        "warn": "WARN ",
        "error": "ERROR",
        "debug": "DEBUG",
      }[level]} ${new Date().toISOString()} ${log
        .replace(/\r\n/g, "\r")
        .replace(/\r/g, "\n")
        .replace(/\n/g, "<br>")
      }\r\n`));
    }
  }
}

export const logStore = new LogStore();

export function log(content:any, level:LogLevels = "log"){
  const text = StringifyObject(content);
  if(!logStore.log && level === "log") return;
  if(text.length < 200){
    console[level](text);
  }else{
    console.warn("[Logger] truncated because content was too big; see logs directory to get complete logs (if not exists, make sure debug is set true in config.json)");
  }
  logStore.addLog(level, text);
}
