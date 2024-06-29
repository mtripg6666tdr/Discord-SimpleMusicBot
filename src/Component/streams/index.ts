/*
 * Copyright 2021-2024 mtripg6666tdr
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

import type { ReadableStreamInfo, StreamInfo, StreamTypeIdentifer, UrlStreamInfo } from "../../AudioSource";
import type { ExportedAudioEffect } from "../audioEffectManager";
import type { Readable } from "stream";

import { opus } from "prism-media";

import { transformThroughFFmpeg } from "./ffmpeg";
import { createPassThrough, downloadAsReadable } from "../../Util";
import { getLogger } from "../../logger";

type PlayableStreamInfo = {
  cost: number,
  streams: Readable[],
  stream: Readable,
  streamType: StreamTypeIdentifer,
};

const logger = getLogger("StreamResolver");

/**
 * Resolve various streams into playable stream
 * @param param0.originalStreamInfo raw stream info object
 * @param param0.effectArgs effect params to pass to ffmpeg
 * @param param0.seek position to seek to if any. if not set 0.
 * @param param0.volumeTransformEnabled whether volume transform is required
 * @returns if volume transform is required, this will return a stream info that represents Ogg/Webm Opus, otherwise return a stream info represents PCM Opus.
 */
export async function resolveStreamToPlayable(
  originalStreamInfo: StreamInfo,
  {
    effects,
    seek,
    volumeTransformEnabled,
    bitrate,
  }: {
    effects: ExportedAudioEffect,
    seek: number,
    volumeTransformEnabled: boolean,
    bitrate: number,
  }
): Promise<PlayableStreamInfo> {
  /** エフェクトが有効になっているか */
  const effectEnabled = effects.args.length !== 0;
  /** シークが有効になっているか  */
  const seekEnabled = seek > 0;
  /** Node.js側でダウンロードすべきかどうか */
  const shouldDownload = originalStreamInfo.type === "url"
    && originalStreamInfo.streamType !== "m3u8"
    && !originalStreamInfo.canBeWithVideo
    && !seekEnabled;
  /** shouldDownloadがtrueの場合は常にReadableStreamInfo。それ以外の場合は、UrlStreamInfoの可能性もあります */
  const streamInfo = shouldDownload ? convertStreamInfoToReadableStreamInfo(originalStreamInfo) : originalStreamInfo;

  if(
    (streamInfo.streamType === "webm/opus" || streamInfo.streamType === "ogg/opus")
    && !seekEnabled
    && !effectEnabled
    && !volumeTransformEnabled
  ){
    // Ogg / Webm --(Demuxer)--> Opus
    logger.info(`stream edges: raw(${originalStreamInfo.streamType}) (no conversion)`);
    return {
      stream: (streamInfo as ReadableStreamInfo).stream,
      streamType: streamInfo.streamType,
      cost: 1,
      streams: [(streamInfo as ReadableStreamInfo).stream],
    };
  }

  const shouldTransformIntoPCM = volumeTransformEnabled;
  const shouldTransformThroughFFmpeg = !shouldDownload || seekEnabled || effectEnabled;

  if(shouldTransformIntoPCM){
    const pcmStream = createPassThrough();
    let pcmCost = 0;
    const streams: Readable[] = [];

    if(!shouldTransformThroughFFmpeg && (streamInfo.streamType === "webm/opus" || streamInfo.streamType === "ogg/opus")){
      // Webm/Ogg --(Demuxer)--> Opus --(Decoder)--> PCM
      //                1                  1.5
      // Total: 2.5
      logger.info(`stream edges: raw(${streamInfo.streamType || "unknown"})--(Demuxer)--(Decoder) --> PCM`);
      const demuxer = streamInfo.streamType === "webm/opus" ? new opus.WebmDemuxer() : new opus.OggDemuxer();
      const decoder = new opus.Decoder({
        rate: 48000,
        channels: 2,
        frameSize: 960,
      });

      const rawStream = (streamInfo as ReadableStreamInfo).stream;

      rawStream
        .on("error", e => destroyStream(demuxer, e))
        .pipe(demuxer)
        .on("error", e => destroyStream(decoder, e))
        .once("close", () => destroyStream(rawStream))
        .pipe(decoder)
        .on("error", e => destroyStream(pcmStream, e))
        .once("close", () => destroyStream(demuxer))
        .pipe(pcmStream)
        .once("close", () => destroyStream(decoder));

      streams.push(rawStream, demuxer, decoder, pcmStream);
      pcmCost += 2.5;
    }else{
      // Unknown --(FFmpeg)--> PCM
      //              2
      logger.info(`stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg) --> PCM`);
      const ffmpeg = transformThroughFFmpeg(streamInfo, { bitrate, effects, seek, output: "pcm" });

      ffmpeg
        .on("error", e => destroyStream(pcmStream, e))
        .pipe(pcmStream)
        .once("close", () => destroyStream(ffmpeg));

      if(streamInfo.type === "readable"){
        streams.push(streamInfo.stream);
      }
      streams.push(ffmpeg, pcmStream);
      pcmCost = 2;
    }

    return {
      stream: pcmStream,
      streamType: "raw",
      streams,
      cost: pcmCost + 0.5 + 1.5,
    };
  }else{
    // Unknown --(FFmpeg)--> Ogg/Opus
    logger.info(`stream edges: raw(${streamInfo.streamType || "unknown"}) --(FFmpeg)--> Webm/Ogg`);
    const ffmpegOutput = streamInfo.streamType === "webm/opus" ? "webm" : "ogg";
    const ffmpeg = transformThroughFFmpeg(streamInfo, { bitrate, effects: effects, seek, output: ffmpegOutput });
    const passThrough = createPassThrough();
    ffmpeg
      .on("error", e => destroyStream(passThrough, e))
      .pipe(passThrough)
      .once("close", () => destroyStream(ffmpeg))
    ;

    return {
      stream: passThrough,
      streamType: ffmpegOutput === "webm" ? "webm/opus" : "ogg/opus",
      cost: 2 + 1,
      // @ts-expect-error undefined will be filtered by Array#filter
      streams: [streamInfo.type === "readable" ? streamInfo.stream : undefined, ffmpeg, passThrough].filter(d => d),
    };
  }
}

export function destroyStream(stream: Readable, error?: Error){
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

function convertStreamInfoToReadableStreamInfo(streamInfo: UrlStreamInfo | ReadableStreamInfo): ReadableStreamInfo{
  if(streamInfo.type === "readable"){
    return streamInfo;
  }

  logger.debug("Converting to Readable.");

  return {
    type: "readable",
    stream: downloadAsReadable(streamInfo.url, streamInfo.userAgent ? {
      headers: {
        "User-Agent": streamInfo.userAgent,
        "cookie": streamInfo.cookie
          ?.split("\n")
          .map(c => c.trim().split(";")[0])
          .join(";"),
      },
    } : {}),
    streamType: streamInfo.streamType,
  };
}
