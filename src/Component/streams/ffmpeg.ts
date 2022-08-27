import type { StreamInfo } from "../../AudioSource";

import { FFmpeg } from "prism-media";

import { destroyStream } from ".";
import Util from "../../Util";
import { DefaultUserAgent, FFmpegDefaultNetworkArgs } from "../../definition";

export function transformThroughFFmpeg(readable:StreamInfo, effectArgs:string[], seek:number, output:"ogg"|"pcm"){
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
    readable.stream
      .on("error", e => destroyStream(ffmpeg, e))
      .pipe(ffmpeg)
      .on("close", () => destroyStream(readable.stream))
    ;
  }
  return ffmpeg;
}
