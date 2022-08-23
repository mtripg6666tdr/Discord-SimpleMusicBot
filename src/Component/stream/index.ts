import type { ReadableStreamInfo, StreamInfo } from "../../AudioSource";

import { opus, VolumeTransformer } from "prism-media";

import Util from "../../Util";
import { transformThroughFFmpeg } from "./ffmpeg";

export function resolveStreamToPlayable(streamInfo:StreamInfo, effects:string[], seek:number, volumeTransform:boolean, initialVolume:number):{stream:ReadableStreamInfo, volume:VolumeTransformer}{
  const effectArgs = effects.join(" ");
  if(streamInfo.type === "readable" && streamInfo.streamType && (streamInfo.streamType === "webm" || streamInfo.streamType === "ogg") && seek <= 0 && !effectArgs && !volumeTransform){
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType}) --> `);
    return {
      stream: streamInfo,
      volume: null,
    };
  }else if(!volumeTransform){
    Util.logger.log(`[StreamResolver] stream edges: raw(${(streamInfo.type === "readable" && streamInfo.streamType) || "unknown"}) --(FFmpeg)-->`);
    return {
      stream: {
        type: "readable",
        stream: transformThroughFFmpeg(streamInfo, effectArgs, seek, "ogg"),
        streamType: "ogg",
      },
      volume: null,
    };
  }else{
    Util.logger.log(`[StreamResolver] stream edges: raw(${(streamInfo.type === "readable" && streamInfo.streamType) || "unknown"}) --(FFmpeg) --> PCM --(VolumeTransformer)--> PCM --(Encoder)-->`);
    const ffmpegPCM = transformThroughFFmpeg(streamInfo, effectArgs, seek, "pcm");
    const volumeTransformer = new VolumeTransformer({
      type: "s16le",
      volume: initialVolume,
    });
    const opusEncoder = new opus.Encoder({
      frameSize: 960,
      channels: 2,
      rate: 48000,
    });
    ffmpegPCM
      .on("error", er => volumeTransformer.destroyed ? volumeTransformer.destroy(er) : volumeTransformer.emit("error", er))
      .pipe(volumeTransformer)
      .on("close", () => !ffmpegPCM.destroyed && ffmpegPCM.destroy())
      .on("error", er => opusEncoder.destroyed ? opusEncoder.destroy(er) : opusEncoder.emit("error", er))
      .pipe(opusEncoder)
      .on("close", () => !opusEncoder.destroyed && opusEncoder.destroy())
    ;
    return {
      stream: {
        type: "readable",
        stream: opusEncoder,
        streamType: "opusPackets" as any,
      },
      volume: volumeTransformer,
    };
  }
}
