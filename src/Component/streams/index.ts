import type { ReadableStreamInfo, StreamInfo, UrlStreamInfo } from "../../AudioSource";
import type { Readable, TransformOptions } from "stream";

import { opus } from "prism-media";

import Util from "../../Util";
import { InitPassThrough } from "../../Util/general";
import { transformThroughFFmpeg } from "./ffmpeg";

export function resolveStreamToPlayable(streamInfo:StreamInfo, effects:string[], seek:number, volumeTransform:boolean):ReadableStreamInfo{
  const effectArgs = effects.join(" ");
  if((streamInfo.streamType === "webm" || streamInfo.streamType === "ogg") && seek <= 0 && !effectArgs && !volumeTransform){
    // 1. effect is off, volume is off, stream is webm or ogg
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType}) --> Ogg/Opus`);
    return streamInfo.type === "url" ? convertUrlStreamInfoToReadableStreamInfo(streamInfo) : streamInfo;
  }else if(!volumeTransform){
    // 2. volume is off and stream is any
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg)--> Ogg/Opus`);
    return {
      type: "readable",
      stream: transformThroughFFmpeg(streamInfo, effectArgs, seek, "ogg"),
      streamType: "ogg",
    };
  }else if((streamInfo.streamType === "webm" || streamInfo.streamType === "ogg") && !effectArgs){
    // 3. volume is on and stream is webm or ogg
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(Demuxer)--(Decoder) --> PCM`);
    const rawStream = streamInfo.type === "url" ? convertUrlStreamInfoToReadableStreamInfo(streamInfo) : streamInfo;
    const opts = {} as TransformOptions;
    const demuxer = streamInfo.streamType === "webm" ? new opus.WebmDemuxer(opts) : new opus.OggDemuxer(opts);
    const decoder = new opus.Decoder({
      rate: 48000,
      channels: 2,
      frameSize: 960
    });
    const passThrough = InitPassThrough();
    rawStream.stream
      .on("error", e => destroyStream(demuxer, e))
      .pipe(demuxer)
      .on("error", e => destroyStream(decoder, e))
      .on("close", () => destroyStream(rawStream.stream))
      .pipe(decoder)
      .on("error", e => destroyStream(passThrough, e))
      .on("close", () => destroyStream(demuxer))
      .pipe(passThrough)
      .on("close", () => destroyStream(decoder))
    ;
    return {
      type: "readable",
      stream: passThrough,
      streamType: "pcm"
    };
  }else{
    // 4. volume is on and stream is unknown
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg) --> PCM`);
    const ffmpegPCM = transformThroughFFmpeg(streamInfo, effectArgs, seek, "pcm");
    const passThrough = InitPassThrough();
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

function convertUrlStreamInfoToReadableStreamInfo(streamInfo:UrlStreamInfo):ReadableStreamInfo{
  return {
    type: "readable",
    stream: Util.web.DownloadAsReadable(streamInfo.url, streamInfo.userAgent ? {
      headers: {
        "User-Agent": streamInfo.userAgent
      }
    } : {}),
    streamType: streamInfo.streamType,
  };
}

export function destroyStream(stream:Readable, error?:Error){
  if(!stream.destroyed){
    stream.destroy(error);
  }else if(error){
    stream.emit("error", error);
  }
}
