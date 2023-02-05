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

import type { ReadableOptions } from "stream";

import { Readable } from "stream";

export class Normalizer extends Readable {
  constructor(protected origin:Readable, protected inlineVolume:boolean, options:ReadableOptions = {}){
    super(Object.assign({
      highWaterMark: 64 * 4 * 1024,
    }, options));

    setImmediate(() => {
      this.on("data", () => {
        if(this.readableLength < this.readableHighWaterMark){
          if(!this.inlineVolume){
            this.resumeOrigin();
          }
        }else{
          this.pauseOrigin();
        }
      });
      this.origin.on("data", chunk => {
        if(!this.push(chunk)){
          this.pauseOrigin();
        }
      });
    });
    this.origin.once("end", () => this.push(null));

    this.onDestroy = this.onDestroy.bind(this);
    this.once("close", this.onDestroy);
    this.once("end", this.onDestroy);
  }

  override _read(){
    if(this.readableLength < this.readableHighWaterMark){
      this.origin.resume();
    }
  }

  pauseOrigin(){
    this.origin.pause();
  }

  resumeOrigin(){
    this.origin.resume();
  }

  protected onDestroy(){
    this.off("close", this.onDestroy);
    this.off("end", this.onDestroy);
    if(!this.origin.destroyed){
      this.origin.destroy();
    }
  }
}
