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

// This was included in v2
// https://github.com/mtripg6666tdr/Discord-SimpleMusicBot/blob/v2/src/Component/AudioResource.ts

import type { VolumeTransformer } from "prism-media";

import { EventEmitter } from "stream";

import * as voice from "@discordjs/voice";

import { getLogger } from "../logger";

class NullMetaAudioResource extends voice.AudioResource<null> {}

const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe]);
const TIMEOUT = 20 * 1000;

// hide 'volume' property trick
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface FixedAudioResource extends NullMetaAudioResource {
  volume: never;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class FixedAudioResource extends NullMetaAudioResource {
  public error = false;
  public readonly events: AudioResourceEvent;
  private readLength = 0;
  private estimatedLengthSeconds = 0;
  private readonly logger = getLogger("FixedAudioResource");
  private dataUnreadableAt = -1;
  private timedout = false;
  protected _volume: VolumeTransformer | null = null;

  get volumeTransformer(){
    return this._volume;
  }

  constructor(...args: ConstructorParameters<typeof NullMetaAudioResource>){
    super(...args);
    this.logger.info("instantiated");
    this.events = new AudioResourceEvent({
      captureRejections: false,
    });
    this.playStream
      .on("error", (er) => {
        this.logger.info(er.message || er.toString(), "error");
        this.error = true;
      })
      .on("end", () => {
        this.events.emit("end");
        this.logger.info(`Pushed total ${this.readLength} bytes${this.estimatedLengthSeconds !== 0 ? ` (average ${Math.round(this.readLength / this.estimatedLengthSeconds * 8 / 100) / 10} kbps)` : ""}`);
      })
    ;
  }

  private get isStreamReadable(){
    return !(this.playStream.readableEnded || this.playStream.destroyed || this.error || this.timedout);
  }

  public override get readable(){
    if(this.silenceRemaining === 0) return false;
    const real = this.isStreamReadable;
    if(!real){
      if(this.silenceRemaining === -1) this.silenceRemaining = this.silencePaddingFrames;
      return this.silenceRemaining !== 0;
    }
    return real;
  }

  public override get ended(){
    return !this.isStreamReadable && this.silenceRemaining === 0;
  }

  public override read(): Buffer | null{
    if(this.silenceRemaining === 0){
      return null;
    }else if(this.silenceRemaining > 0){
      this.silenceRemaining--;
      return SILENCE_FRAME;
    }

    if(this.playStream.readable){
      if(this.dataUnreadableAt !== -1){
        this.logger.trace("Stream is now readable");
        this.dataUnreadableAt = -1;
      }
    }else if(this.dataUnreadableAt === -1){
      this.logger.trace("Stream becomes unreadable");
      this.dataUnreadableAt = Date.now();
      return SILENCE_FRAME;
    }else if(this.dataUnreadableAt - Date.now() >= TIMEOUT){
      this.logger.trace("Stream timed out");
      this.timedout = true;
    }else{
      this.logger.trace("Stream is not readable; sending silence frame");
      return SILENCE_FRAME;
    }

    if(this.timedout){
      return null;
    }

    const packet: Buffer | null = this.playStream.read();
    if(packet){
      this.playbackDuration += 20;
      this.readLength += packet.length || 0;
    }
    return packet;
  }

  static fromAudioResource(resource: voice.AudioResource, estimatedLengthSeconds: number){
    const _this = new this(resource.edges, [resource.playStream], null, resource.silencePaddingFrames);
    _this.estimatedLengthSeconds = estimatedLengthSeconds;
    _this._volume = resource.volume || null;
    return _this;
  }
}

interface EventKeys {
  end: [];
  error: [Error];
}

class AudioResourceEvent extends EventEmitter {
  override on<T extends keyof EventKeys>(event: T, callback: (...args: EventKeys[T]) => any): this{
    super.on(event, callback);
    return this;
  }

  override off<T extends keyof EventKeys>(event: T, callback: (...args: EventKeys[T]) => any){
    super.off(event, callback);
    return this;
  }

  override once<T extends keyof EventKeys>(event: T, callback: (...args: EventKeys[T]) => any){
    super.once(event, callback);
    return this;
  }

  override addListener<T extends keyof EventKeys>(event: T, callback: (...args: EventKeys[T]) => any){
    super.addListener(event, callback);
    return this;
  }

  override removeListener<T extends keyof EventKeys>(event: T, callback: (...args: EventKeys[T]) => any){
    super.removeListener(event, callback);
    return this;
  }

  override removeAllListeners<T extends keyof EventKeys>(event: T){
    super.removeAllListeners(event);
    return this;
  }

  override emit<T extends keyof EventKeys>(event: T, ...args: EventKeys[T]){
    return super.emit(event, args);
  }
}
