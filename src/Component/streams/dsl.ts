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

import type { Readable } from "stream";

import fs from "fs";
import path from "path";

import { LogEmitter } from "../../Structure";

type DSLOptions = {
  enableFileLog?: boolean,
  enableMemoryLog?: boolean,
};

/**
 * DSL = Detailed Steram Logging = 詳細ストリームログ機能を実装します
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export class DSL extends LogEmitter<{}> {
  protected csvLog: string[] | null = null;
  protected logStreams: Readable[] = [];
  protected logFileName: string | null = null;
  protected logFileStream: fs.WriteStream | null = null;

  constructor(protected options: DSLOptions){
    super("DSL");
    this.logger.warn("CSV based detailed log enabled.");
    if(options.enableFileLog){
      this.logFileName = path.join(__dirname, `${global.BUNDLED ? "../" : "../../"}../logs/stream-${Date.now()}.csv`);
      this.logFileStream = fs.createWriteStream(this.logFileName);
      this.logFileStream.once("close", () => this.logger.info("CSV file closed"));
      this.logger.warn(`CSV filename will be ${this.logFileName}`);
    }else if(options.enableMemoryLog){
      this.csvLog = [];
    }
    this.appendCsvLog("type,datetime,id,total,current");
  }

  getCsvLog(): readonly string[] | null {
    return this.csvLog;
  }

  appendReadable(...streams: Readable[]){
    streams.forEach(readable => {
      if(!readable) return;
      const i = this.logStreams.push(readable);
      this.logger.info(`ID:${i}=${readable.constructor.name} (highWaterMark:${readable.readableHighWaterMark})`);
      let total = 0;
      const onClose = () => {
        readable.off("close", onClose);
        readable.off("end", onClose);
        this.appendCsvLog(`total,${this.getNow()},${i},${total}`);
        const inx = this.logStreams.findIndex(s => s === readable);
        if(inx >= 0){
          this.logStreams.splice(inx, 1);
          this.logger.info(this.logStreams);
          if(this.logStreams.length === 0 && this.logFileStream && !this.logFileStream.destroyed){
            this.logFileStream.destroy();
            this.logger.info("CSV log saved successfully");
          }
        }
      };
      readable.on("data", chunk => {
        this.appendCsvLog(`flow,${this.getNow()},${i},${total += chunk.length},${chunk.length}`);
        this.appendCsvLog(`stock,${this.getNow()},${i},,${readable.readableLength}`);
      });
      readable.on("close", onClose);
      readable.on("end", onClose);
      readable.on("error", er => this.appendCsvLog(`error,${new Date().toLocaleString()},${i},${er}`));
    });
  }

  appendCsvLog(line: string){
    if(this.csvLog){
      this.csvLog.push(line);
    }else if(this.logFileStream){
      this.logFileStream.write(line + "\r\n");
    }
  }

  destroy(){
    this.logger.info("Destroyed");
    this.csvLog = null;
    this.logFileStream?.destroy();
    this.logFileStream = null;
  }

  protected getNow(){
    const now = new Date();
    return `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
  }
}
