/*
 * Copyright 2021-2022 mtripg6666tdr
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

import type { StreamInfo, StreamType, UrlStreamInfo } from "../../AudioSource";
import type { Readable, TransformOptions } from "stream";

import { opus } from "prism-media";

import Util from "../../Util";
import { createPassThrough } from "../../Util/general";
import { transformThroughFFmpeg } from "./ffmpeg";

type PlayableStreamInfo = PartialPlayableStream & {
  cost:number,
};

type PartialPlayableStream = {
  stream:Readable,
  streamType:StreamType,
};

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
export function resolveStreamToPlayable(streamInfo:StreamInfo, effects:string[], seek:number, volumeTransform:boolean, bitrate:number):PlayableStreamInfo{
  const effectEnabled = effects.length !== 0;
  if((streamInfo.streamType === "webm" || streamInfo.streamType === "ogg") && seek <= 0 && !effectEnabled && !volumeTransform){
    // 1. effect is off, volume is off, stream is webm or ogg
    // Webm/Ogg --(Demuxer)--> Opus
    //                1
    // Total: 1
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType}) (no convertion/cost: 1)`);
    const info = streamInfo.type === "url" ? convertUrlStreamInfoToReadableStreamInfo(streamInfo) : streamInfo;
    return {
      stream: info.stream,
      streamType: info.streamType,
      cost: 1,
    };
  }else if(!volumeTransform){
    // 2. volume is off and stream is any
    // Unknown --(FFmpeg)--> Ogg/Opus --(Demuxer)--> Opus
    //               2                      1
    // Total: 3
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg)--> Ogg/Opus (cost: 3)`);
    const ffmpeg = transformThroughFFmpeg(streamInfo, bitrate, effects, seek, "ogg");
    const passThrough = createPassThrough();
    ffmpeg
      .on("error", e => destroyStream(passThrough, e))
      .pipe(passThrough)
      .on("close", () => destroyStream(ffmpeg))
    ;
    return {
      stream: passThrough,
      streamType: "ogg",
      cost: 3,
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
      frameSize: 960,
    });
    const passThrough = createPassThrough();
    const normalizeThrough = createPassThrough();
    rawStream.stream
      .pipe(normalizeThrough)
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
      stream: passThrough,
      streamType: "pcm",
      cost: 4.5,
    };
  }else{
    // 4. volume is on and stream is unknown
    // Unknown --(FFmpeg)--> PCM --(VolumeTransformer)--> PCM --(Encoder)--> Opus
    //              2                     0.5                      1.5
    // Total: 5
    Util.logger.log(`[StreamResolver] stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg) --> PCM (cost: 5)`);
    const ffmpegPCM = transformThroughFFmpeg(streamInfo, bitrate, effects, seek, "pcm");
    const passThrough = createPassThrough();
    ffmpegPCM
      .on("error", e => destroyStream(passThrough, e))
      .pipe(passThrough)
      .on("close", () => destroyStream(ffmpegPCM))
    ;
    return {
      stream: passThrough,
      streamType: "pcm",
      cost: 5,
    };
  }
}

function convertUrlStreamInfoToReadableStreamInfo(streamInfo:UrlStreamInfo):PartialPlayableStream{
  return {
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
