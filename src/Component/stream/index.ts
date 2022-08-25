import type { ReadableStreamInfo, StreamInfo } from "../../AudioSource";

import Util from "../../Util";
import { InitPassThrough } from "../../Util/general";
import { transformThroughFFmpeg } from "./ffmpeg";

export function resolveStreamToPlayable(streamInfo:StreamInfo, effects:string[], seek:number, volumeTransform:boolean):ReadableStreamInfo{
  const effectArgs = effects.join(" ");
  volumeTransform = true;
  if(streamInfo.type === "readable" && streamInfo.streamType && (streamInfo.streamType === "webm" || streamInfo.streamType === "ogg") && seek <= 0 && !effectArgs && !volumeTransform){
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType}) --> `);
    return streamInfo;
  }else if(!volumeTransform){
    Util.logger.log(`[StreamResolver] stream edges: raw(${(streamInfo.type === "readable" && streamInfo.streamType) || "unknown"}) --(FFmpeg)-->`);
    return {
      type: "readable",
      stream: transformThroughFFmpeg(streamInfo, effectArgs, seek, "ogg"),
      streamType: "ogg",
    };
  }else{
    Util.logger.log(`[StreamResolver] stream edges: raw(${(streamInfo.type === "readable" && streamInfo.streamType) || "unknown"}) --(FFmpeg) --> PCM`);
    const ffmpegPCM = transformThroughFFmpeg(streamInfo, effectArgs, seek, "pcm");
    const passThrough = InitPassThrough({
      highWaterMark: 0
    });
    ffmpegPCM
      .on("error", e => !passThrough.destroyed ? passThrough.destroy(e) : passThrough.emit("error", e))
      .pipe(passThrough)
      .on("close", () => !ffmpegPCM.destroyed && ffmpegPCM.destroy())
    ;
    return {
      type: "readable",
      stream: passThrough,
      streamType: "pcm",
    };
  }
}
