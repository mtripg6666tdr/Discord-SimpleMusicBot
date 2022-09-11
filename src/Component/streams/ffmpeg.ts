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

import type { StreamInfo } from "../../AudioSource";

import { FFmpeg } from "prism-media";

import { destroyStream } from ".";
import Util from "../../Util";
import { createPassThrough } from "../../Util/general";
import { DefaultUserAgent, FFmpegDefaultNetworkArgs } from "../../definition";

export function transformThroughFFmpeg(readable:StreamInfo, bitrate:number, effectArgs:string[], seek:number, output:"ogg"|"pcm"){
  const ffmpegNetworkArgs = readable.type === "url" ? [
    ...FFmpegDefaultNetworkArgs,
    "-user_agent", readable.userAgent || DefaultUserAgent
  ] : [];
  const ffmpegSeekArgs = seek > 0 ? [
    "-ss", seek.toString(),
  ] : [];
  const outputArgs = output === "ogg" ? [
    "-acodec", "libopus",
    "-f", "opus",
  ] : [
    "-f", "s16le",
  ];
  const bitrateArgs = effectArgs.length === 2 && effectArgs[1].includes("loudnorm") ? [] : [
    "-vbr", "on",
    "-b:a", bitrate.toString(),
  ];
  const args = [
    "-analyzeduration", "0",
    ...ffmpegNetworkArgs,
    ...ffmpegSeekArgs,
    "-i", readable.type === "readable" ? "-" : readable.url,
    ...effectArgs,
    "-vn",
    ...outputArgs,
    "-ar", "48000",
    "-ac", "2",
    ...bitrateArgs,
  ];
  Util.logger.log("[FFmpeg] Passing arguments: " + args.map(arg => arg.startsWith("http") ? "<URL>" : arg).join(" "), "debug");
  const ffmpeg = new FFmpeg({args});
  if(Util.config.debug) ffmpeg.process.stderr.on("data", chunk => Util.logger.log("[FFmpeg]" + chunk.toString(), "debug"));
  if(readable.type === "readable"){
    const normalizeThrough = createPassThrough();
    readable.stream
      .on("error", e => destroyStream(normalizeThrough, e))
      .pipe(normalizeThrough)
      .on("error", e => destroyStream(ffmpeg, e))
      .on("close", () => destroyStream(readable.stream))
      .pipe(ffmpeg)
      .on("close", () => destroyStream(normalizeThrough))
    ;
  }
  return ffmpeg;
}
