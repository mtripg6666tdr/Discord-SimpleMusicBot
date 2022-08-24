import type { ReadableStreamInfo, StreamInfo } from "../../AudioSource";

import { VolumeTransformer } from "prism-media";

import Util from "../../Util";
import { InitPassThrough } from "../../Util/general";
import { transformThroughFFmpeg } from "./ffmpeg";

export function resolveStreamToPlayable(streamInfo:StreamInfo, effects:string[], seek:number, volumeTransform:boolean, initialVolume:number):{stream:ReadableStreamInfo, volume:VolumeTransformer}{
  const effectArgs = effects.join(" ");
  volumeTransform = true;
  if(streamInfo.type === "url"){
    streamInfo = {
      type: "readable",
      stream: Util.web.DownloadAsReadable(streamInfo.url, {
        maxReconnects: 10
      })
    };
  }
  if(streamInfo.streamType && (streamInfo.streamType === "webm" || streamInfo.streamType === "ogg") && seek <= 0 && !effectArgs && !volumeTransform){
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType}) --> `);
    return {
      stream: streamInfo,
      volume: null,
    };
  }else if(!volumeTransform){
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg)-->`);
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
    const passThrough = InitPassThrough();
    const volumeTransformer = new VolumeTransformer({
      type: "s16le",
      volume: initialVolume,
      highWaterMark: 0,
    } as any);
    ffmpegPCM
      .on("error", e => !passThrough.destroyed ? passThrough.destroy(e) : passThrough.emit("error", e))
      .pipe(passThrough)
      .on("error", e => !volumeTransformer.destroyed ? volumeTransformer.destroy(e) : volumeTransformer.emit("error", e))
      .pipe(volumeTransformer)
    ;
    return {
      stream: {
        type: "readable",
        stream: volumeTransformer,
        streamType: "pcm",
      },
      volume: volumeTransformer,
    };
  }
}
