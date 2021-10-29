import * as voice from "@discordjs/voice";
import { EventEmitter } from "stream";

class NullMetaAudioResource extends voice.AudioResource<null> {};

const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe]);

export class FixedAudioResource extends NullMetaAudioResource {
  public error = false;
  public readonly events = null as AudioResourceEvent;

  constructor(...args:ConstructorParameters<typeof NullMetaAudioResource>){
    super(...args);
    this.events = new AudioResourceEvent({
      captureRejections: false
    });
    this.playStream
      .on("error", (er) => {
        console.error(er);
        this.error = true;
        this.events.emit("error", er);
      })
      .on("end", () => {
        this.events.emit("end");
      })
  }

  private get isStreamReadable() {
    return !(this.playStream.readableEnded || this.playStream.destroyed || this.error)
  }

  public get readable(){
    if (this.silenceRemaining === 0) return false;
    const real = this.isStreamReadable;
    if (!real) {
      if (this.silenceRemaining === -1) this.silenceRemaining = this.silencePaddingFrames;
      return this.silenceRemaining !== 0;
    }
    return real;
  }

  public get ended() {
    return !this.isStreamReadable && this.silenceRemaining === 0;
	}

  public read(): Buffer | null {
    if (this.silenceRemaining === 0) {
      return null;
    } else if (this.silenceRemaining > 0) {
      if (this.isStreamReadable){
        this.silenceRemaining = -1;
      } else {
        this.silenceRemaining--;
        return SILENCE_FRAME;
      }
    }
    if(!this.playStream.readable){
      return SILENCE_FRAME;
    }
    const packet: Buffer | null = this.playStream.read();
    if (packet) {
      this.playbackDuration += 20;
    }
    return packet;
  }

  static fromAudioResource(resource:voice.AudioResource){
    return new this(resource.edges, [resource.playStream], null, resource.silencePaddingFrames);
  }
}

interface EventKeys {
  end: [];
  error: [Error];
}

class AudioResourceEvent extends EventEmitter {
  on<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any):this{
    super.on(event, callback);
    return this;
  }
  off<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any) {
    super.off(event, callback);
    return this;
  }
  once<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any) {
    super.once(event, callback);
    return this;
  }
  addListener<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any) {
    super.addListener(event, callback);
    return this;
  }
  removeListener<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any) {
    super.removeListener(event, callback);
    return this;
  }
  removeAllListeners<T extends keyof EventKeys>(event:T) {
    super.removeAllListeners(event);
    return this;
  }
  emit<T extends keyof EventKeys>(event:T, ...args:EventKeys[T]){
    return super.emit(event, args);
  }
}