/*
 * Copyright 2021-2024 mtripg6666tdr
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

import { bindThis } from "../../Util/decorators";
import { getLogger } from "../../logger";

export class Normalizer extends Readable {
  protected resumeHighWaterMark: number;
  protected logger = getLogger("Normalizer");
  protected _destroyed = false;

  constructor(protected origin: Readable, protected inlineVolume: boolean, options: ReadableOptions = {}){
    super(Object.assign({
      highWaterMark: 64 * 4 * 1024 * (inlineVolume ? 5 : 1),
    }, options));

    this.resumeHighWaterMark = this.readableHighWaterMark * 0.6;

    const now = Date.now();
    setImmediate(() => {
      if(this.origin){
        this.on("data", () => {
          if(this.readableLength < this.resumeHighWaterMark){
            this.resumeOrigin();
          }else{
            this.pauseOrigin();
          }
        });
        this.origin.on("data", chunk => {
          if(!this.push(chunk)){
            this.pauseOrigin();
          }
        });
        this.origin.once("data", chunk => {
          this.logger.debug(`first chunk received; elapsed ${Date.now() - now}ms / ${chunk.length} bytes`);
        });
      }
    }).unref();
    this.origin.once("end", () => this.push(null));
    this.origin.on("error", er => this.destroy(er));

    this.once("close", this._onDestroy);
    this.once("end", this._onDestroy);

    this.logger.info("initialized");
  }

  override _read(){
    if(this.readableLength < this.readableHighWaterMark){
      this.resumeOrigin();
    }
  }

  pauseOrigin(){
    if(this.origin && !this.origin.destroyed && !this.origin.isPaused()){
      this.logger.debug(`Origin paused (${this.readableLength}/${this.readableHighWaterMark})`);
      this.origin.pause();
    }
  }

  resumeOrigin(){
    if(this.origin && !this.origin.destroyed && this.origin.isPaused()){
      this.logger.debug(`Origin resumed (${this.readableLength}/${this.readableHighWaterMark})`);
      this.origin.resume();
    }
  }

  @bindThis
  protected _onDestroy(){
    if(this._destroyed){
      return;
    }
    this._destroyed = true;
    this.logger.debug("Destroy hook called");
    this.off("close", this._onDestroy);
    this.off("end", this._onDestroy);
    if(this.origin){
      this.logger.info("Attempting to destroy origin");
      if(!this.origin.destroyed){
        this.origin.destroy();
      }
      this.origin = null!;
      try{
        if("_readableState" in this){
          // @ts-expect-error 2339
          this._readableState.buffer.clear();
          // @ts-expect-error 2339
          this._readableState.length = 0;
        }
      }
      catch{/* empty */}
    }
  }
}
