import type { ReadableStreamInfo, StreamInfo, UrlStreamInfo } from "../../AudioSource";
import type { Readable, TransformOptions } from "stream";

import { opus } from "prism-media";

import Util from "../../Util";
import { InitPassThrough } from "../../Util/general";
import { transformThroughFFmpeg } from "./ffmpeg";

/*
Convertion cost:
  FFmpeg:2
  OggDemuxer: 1
  WebmDemuxer: 1
  opusDecoder: 1.5
  opusEncoder: 1.5
  VolumeTransfomer: 0.5
Refer at: https://github.com/discordjs/discord.js/blob/13baf75cae395353f0528804ff0d71468f21daa9/packages/voice/src/audio/TransformerGraph.ts
*/

/**
 * Resolve various streams into playable stream
 * @param streamInfo raw stream info object
 * @param effects effect params to pass to ffmpeg
 * @param seek position to seek to if any. if not set 0.
 * @param volumeTransform whether volume transform is required
 * @returns if volume transform is required, this will return a stream info that represents Ogg/Webm Opus, otherwise return a stream info represents PCM Opus.
 */
export function resolveStreamToPlayable(streamInfo:StreamInfo, effects:string[], seek:number, volumeTransform:boolean):ReadableStreamInfo{
  const effectEnabled = effects.length !== 0;
  if((streamInfo.streamType === "webm" || streamInfo.streamType === "ogg") && seek <= 0 && !effectEnabled && !volumeTransform){
    // 1. effect is off, volume is off, stream is webm or ogg
    // Webm/Ogg --(Demuxer)--> Opus
    //                1
    // Total: 1
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType}) (no convertion/cost: 1)`);
    return streamInfo.type === "url" ? convertUrlStreamInfoToReadableStreamInfo(streamInfo) : streamInfo;
  }else if(!volumeTransform){
    // 2. volume is off and stream is any
    // Unknown --(FFmpeg)--> Ogg/Opus --(Demuxer)--> Opus
    //               2                      1
    // Total: 3
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg)--> Ogg/Opus (cost: 3)`);
    const ffmpeg = transformThroughFFmpeg(streamInfo, effects, seek, "ogg");
    const passThrough = InitPassThrough();
    ffmpeg
      .on("error", e => destroyStream(passThrough, e))
      .pipe(passThrough)
      .on("close", () => destroyStream(ffmpeg))
    ;
    return {
      type: "readable",
      stream: passThrough,
      streamType: "ogg",
    };
  }else if((streamInfo.streamType === "webm" || streamInfo.streamType === "ogg") && !effectEnabled){
    // 3. volume is on and stream is webm or ogg
    // Webm/Ogg --(Demuxer)--> Opus --(Decoder)--> PCM --(VolumeTransformer)--> PCM --(Encoder)--> Opus
    //                1                  1.5                    0.5                      1.5
    // Total: 4.5
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(Demuxer)--(Decoder) --> PCM (cost: 4.5)`);
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
    // Unknown --(FFmpeg)--> PCM --(VolumeTransformer)--> PCM --(Encoder)--> Opus
    //              2                     0.5                      1.5
    // Total: 5
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg) --> PCM (cost: 5)`);
    const ffmpegPCM = transformThroughFFmpeg(streamInfo, effects, seek, "pcm");
    const passThrough = InitPassThrough();
    ffmpegPCM
      .on("error", e => destroyStream(passThrough, e))
      .pipe(passThrough)
      .on("close", () => destroyStream(ffmpegPCM))
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
