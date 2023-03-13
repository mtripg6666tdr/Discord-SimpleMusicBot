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

import type { StreamInfo } from "../../AudioSource";

import { FFmpeg } from "prism-media";

import { destroyStream } from ".";
import { DefaultUserAgent } from "../../definition";
import { getLogger } from "../../logger";

const FFmpegDefaultNetworkArgs = [
  "-reconnect", "1",
  "-reconnect_streamed", "1",
  "-reconnect_on_network_error", "1",
  "-reconnect_on_http_error", "4xx,5xx",
  "-reconnect_delay_max", "30",
] as const;

const logger = getLogger("FFmpeg");

export function transformThroughFFmpeg(
  readable: StreamInfo,
  {
    bitrate,
    effectArgs,
    seek,
    output,
  }: {
    bitrate: number,
    effectArgs: string[],
    seek: number,
    output: "ogg"|"pcm",
  }
){
  const ffmpegNetworkArgs = readable.type === "url" ? [
    ...FFmpegDefaultNetworkArgs,
    "-user_agent", readable.userAgent || DefaultUserAgent,
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
  logger.debug("Passing arguments: " + args.map(arg => arg.startsWith("http") ? "<URL>" : arg).join(" "));
  const ffmpeg = new FFmpeg({ args });
  ffmpeg.process.stderr.on("data", chunk => logger.debug(chunk.toString()));
  ffmpeg.process.once("exit", () => {
    ffmpeg.emit("close");
  });
  if(readable.type === "readable"){
    readable.stream
      .on("error", e => destroyStream(ffmpeg, e))
      .pipe(ffmpeg)
      .once("close", () => destroyStream(readable.stream))
    ;
  }
  return ffmpeg;
}
