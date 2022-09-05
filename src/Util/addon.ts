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

import type { Client, Interaction, Message } from "eris";

import * as fs from "fs";
import * as path from "path";
import { EventEmitter } from "stream";

interface EventKeys {
  ready: [client:Client];
  messageCreate: [message: Message];
  interactionCreate: [interaction: Interaction];
}

export class AddOn extends EventEmitter {
  on<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any):this{
    super.on(event, callback);
    return this;
  }

  off<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any){
    super.off(event, callback);
    return this;
  }

  once<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any){
    super.once(event, callback);
    return this;
  }

  addListener<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any){
    super.addListener(event, callback);
    return this;
  }

  removeListener<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any){
    super.removeListener(event, callback);
    return this;
  }

  removeAllListeners<T extends keyof EventKeys>(event:T){
    super.removeAllListeners(event);
    return this;
  }

  emit<T extends keyof EventKeys>(event:T, ...args:EventKeys[T]){
    return super.emit(event, args);
  }

  constructor(){
    super({captureRejections: false});
    try{
      fs.readdirSync(path.join(__dirname, "../../addon/"), {withFileTypes: true})
        .filter(d => d.isFile())
        .map(d => require("../../addon/" + d.name.slice(0, -3)))
        .filter(d => typeof d === "function")
        .forEach(d => {
          try{
            d(this);
          }
          // eslint-disable-next-line no-empty
          catch{}
        });
    }
    // eslint-disable-next-line no-empty
    catch{}
  }
}
