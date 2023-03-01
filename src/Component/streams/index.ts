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

import type { ReadableStreamInfo, StreamInfo, StreamType, UrlStreamInfo } from "../../AudioSource";
import type { Readable } from "stream";

import { opus } from "prism-media";

import { transformThroughFFmpeg } from "./ffmpeg";
import Util from "../../Util";
import { createPassThrough } from "../../Util/general";

type PlayableStreamInfo = {
  cost:number,
  streams:Readable[],
  stream:Readable,
  streamType:StreamType,
};

/*
Conversion cost:
  FFmpeg:2
  OggDemuxer: 1
  WebmDemuxer: 1
  opusDecoder: 1.5
  opusEncoder: 1.5
  VolumeTransfomer: 0.5
Refer at: https://github.com/discordjs/discord.js/blob/13baf75cae395353f0528804ff0d71468f21daa9/packages/voice/src/audio/TransformerGraph.ts

Ogg might be naturally considered to be ok to be passed to eris's voice module as it is however from lots of experiments OggOpusTransformer of eris doesn't detect the end of the stream,
so we decided to pass the strean if it is just Webm/Opus stream.
(Besides above, PCMOpusTransformer seems to work fine.)
*/

/**
 * Resolve various streams into playable stream
 * @param streamInfo raw stream info object
 * @param effects effect params to pass to ffmpeg
 * @param seek position to seek to if any. if not set 0.
 * @param volumeTransform whether volume transform is required
 * @returns if volume transform is required, this will return a stream info that represents Ogg/Webm Opus, otherwise return a stream info represents PCM Opus.
 */
export function resolveStreamToPlayable(streamInfo:StreamInfo, effects:string[], seek:number, volumeTransform:boolean, bitrate:number):PlayableStreamInfo{
  const effectEnabled = effects.length !== 0;
  if(streamInfo.streamType === "webm" && seek <= 0 && !effectEnabled && !volumeTransform){
    // 1. effect is off, volume is off, stream is webm
    // Webm --(Demuxer)--> Opus
    //                1
    // Total: 1
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType}) (no conversion/cost: 1)`);
    const info = streamInfo.type === "url" ? convertStreamInfoToReadableStreamInfo(streamInfo) : streamInfo;
    return {
      stream: info.stream,
      streamType: "webm",
      cost: 1,
      streams: [info.stream],
    };
  }else if(!volumeTransform){
    // 2. volume is off and stream is unknown
    // Unknown --(FFmpeg)--> Webm/Opus or Webm/Vorbis --(Demuxer)--> Opus
    //               2                      1
    // Total: 3
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg)--> Webm/Opus (cost: 3)`);
    const info = seek > 0 || (streamInfo.type === "url" && streamInfo.url.split("?")[0].endsWith(".m3u8")) ? streamInfo : convertStreamInfoToReadableStreamInfo(streamInfo);
    const ffmpeg = transformThroughFFmpeg(info, bitrate, effects, seek, "webm");
    const passThrough = createPassThrough();
    ffmpeg
      .on("error", e => destroyStream(passThrough, e))
      .pipe(passThrough)
      .once("close", () => destroyStream(ffmpeg))
    ;
    return {
      stream: passThrough,
      streamType: "webm",
      cost: 3,
      streams: [streamInfo.type === "readable" ? streamInfo.stream : undefined, ffmpeg, passThrough].filter(d => d),
    };
  }else if((streamInfo.streamType === "webm" || streamInfo.streamType === "ogg") && !effectEnabled && seek <= 0){
    // 3. volume is on and stream is webm or ogg
    // Webm/Ogg --(Demuxer)--> Opus --(Decoder)--> PCM --(VolumeTransformer)--> PCM --(Encoder)--> Opus
    //                1                  1.5                    0.5                      1.5
    // Total: 4.5
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(Demuxer)--(Decoder) --> PCM (cost: 4.5)`);
    const rawStream = streamInfo.type === "url" ? convertStreamInfoToReadableStreamInfo(streamInfo) : streamInfo;
    const demuxer = streamInfo.streamType === "webm" ? new opus.WebmDemuxer() : new opus.OggDemuxer();
    const decoder = new opus.Decoder({
      rate: 48000,
      channels: 2,
      frameSize: 960,
    });
    const passThrough = createPassThrough();
    rawStream.stream
      .on("error", e => destroyStream(demuxer, e))
      .pipe(demuxer)
      .on("error", e => destroyStream(decoder, e))
      .once("close", () => destroyStream(rawStream.stream))
      .pipe(decoder)
      .on("error", e => destroyStream(passThrough, e))
      .once("close", () => destroyStream(demuxer))
      .pipe(passThrough)
      .once("close", () => destroyStream(decoder))
    ;
    return {
      stream: passThrough,
      streamType: "pcm",
      cost: 4.5,
      streams: [rawStream.stream, demuxer, decoder, passThrough],
    };
  }else{
    // 4. volume is on and stream is unknown
    // Unknown --(FFmpeg)--> PCM --(VolumeTransformer)--> PCM --(Encoder)--> Opus
    //              2                     0.5                      1.5
    // Total: 5
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg) --> PCM (cost: 5)`);
    const info = seek > 0 ? streamInfo : convertStreamInfoToReadableStreamInfo(streamInfo);
    const ffmpegPCM = transformThroughFFmpeg(info, bitrate, effects, seek, "pcm");
    const passThrough = createPassThrough();
    ffmpegPCM
      .on("error", e => destroyStream(passThrough, e))
      .pipe(passThrough)
      .once("close", () => destroyStream(ffmpegPCM))
    ;
    return {
      stream: passThrough,
      streamType: "pcm",
      cost: 5,
      streams: [streamInfo.type === "readable" ? streamInfo.stream : undefined, ffmpegPCM, passThrough].filter(d => d),
    };
  }
}

function convertStreamInfoToReadableStreamInfo(streamInfo:UrlStreamInfo|ReadableStreamInfo):ReadableStreamInfo{
  if(streamInfo.type === "readable"){
    return streamInfo;
  }
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
    // if stream._destroy was overwritten, callback might not be called so make sure to be called.
    const originalDestroy = stream._destroy;
    stream._destroy = function(er, callback){
      originalDestroy.apply(this, [er, () => {}]);
      callback.apply(this, [er]);
    };
    stream.destroy(error);
  }else if(error){
    stream.emit("error", error);
  }
}
