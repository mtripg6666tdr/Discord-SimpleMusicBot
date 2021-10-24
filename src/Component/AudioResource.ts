import * as voice from "@discordjs/voice";

class NullMetaAudioResource extends voice.AudioResource<null> {};

export class FixedAudioResource extends NullMetaAudioResource {
  public error = false;
  constructor(...args:ConstructorParameters<typeof NullMetaAudioResource>){
    super(...args);
    this.playStream.on("error", (er) => {
      console.error(er);
      this.error = true;
    });
  }

  public get readable(){
    if (this.silenceRemaining === 0) return false;
		const real = !(this.playStream.readableEnded || this.playStream.destroyed || this.error);
		if (!real) {
			if (this.silenceRemaining === -1) this.silenceRemaining = this.silencePaddingFrames;
			return this.silenceRemaining !== 0;
		}
		return real;
  }

  public get ended() {
		return this.playStream.readableEnded || this.playStream.destroyed || this.error || this.silenceRemaining === 0;
	}

  static fromAudioResource(resource:voice.AudioResource){
    return new this(resource.edges, [resource.playStream], null, resource.silencePaddingFrames);
  }
}