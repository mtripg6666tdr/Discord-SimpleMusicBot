import * as voice from "@discordjs/voice";

class NullMetaAudioResource extends voice.AudioResource<null> {};

const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe]);

export class FixedAudioResource extends NullMetaAudioResource {
  public error = false;
  constructor(...args:ConstructorParameters<typeof NullMetaAudioResource>){
    super(...args);
    this.playStream.on("error", (er) => {
      console.error(er);
      this.error = true;
    });
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