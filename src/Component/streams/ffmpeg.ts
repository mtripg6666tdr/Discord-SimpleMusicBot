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

import type { StreamInfo } from "../../AudioSource";
import type { ExportedAudioEffect } from "../audioEffectManager";

import { FFmpeg } from "prism-media";

import { destroyStream } from ".";
import { DefaultUserAgent } from "../../definition";
import { getLogger } from "../../logger";

export const FFmpegDefaultNetworkArgs = [
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
    effects,
    seek,
    output,
  }: {
    bitrate: number,
    effects: ExportedAudioEffect,
    seek: number,
    output: "webm"|"ogg"|"pcm",
  }
){
  const ffmpegNetworkArgs = readable.type === "url" ? [
    ...FFmpegDefaultNetworkArgs,
    "-user_agent", readable.userAgent || DefaultUserAgent,
  ] : [];
  const ffmpegCookieArgs = readable.type === "url" && readable.cookie ? [
    "-cookies", readable.cookie,
  ] : [];
  const ffmpegSeekArgs = seek > 0 ? [
    "-ss", seek.toString(),
  ] : [];
  const outputArgs: string[] = [];
  const bitrateArgs: string[] = [];

  if(
    effects.args.length === 0
    && ((output === "webm" && readable.streamType === "webm/opus") || (output === "ogg" && readable.streamType === "ogg/opus"))
  ){
    outputArgs.push(
      "-f", output === "ogg" ? "opus" : "webm",
      "-acodec", "copy",
    );
  }else if(output === "ogg" || output === "webm"){
    outputArgs.push(
      "-f", output === "ogg" ? "opus" : "webm",
      "-acodec", "libopus",
    );
  }else{
    outputArgs.push(
      "-f", "s16le",
      "-ar", "48000",
      "-ac", "2",
    );
  }

  if(!effects.shouldDisableVbr){
    bitrateArgs.push(
      "-vbr", "on",
    );
  }

  bitrateArgs.push("-b:a", bitrate.toString());

  const args = [
    "-analyzeduration", "0",
    ...ffmpegNetworkArgs,
    ...ffmpegSeekArgs,
    ...ffmpegCookieArgs,
    "-i", readable.type === "readable" ? "-" : readable.url,
    ...effects.args,
    "-vn",
    ...outputArgs,
    ...bitrateArgs,
  ];
  logger.debug("Passing arguments: " + args.map(arg => arg.startsWith("http") ? "<URL>" : arg).join(" "));
  const ffmpeg = new FFmpeg({ args });
  ffmpeg.process.stderr?.on("data", chunk => logger.debug(chunk.toString()));
  ffmpeg.process.once("exit", (code, signal) => {
    logger.debug(`FFmpeg process exited (code: ${code}, signal: ${signal})`);
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
