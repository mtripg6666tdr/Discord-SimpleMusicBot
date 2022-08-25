import type { StreamInfo } from "../../AudioSource";

import { FFmpeg } from "prism-media";

import { destroyStream } from ".";
import Util from "../../Util";
import { DefaultUserAgent, FFmpegDefaultArgs } from "../../definition";

export function transformThroughFFmpeg(readable:StreamInfo, effectArgs:string[], seek:number, output:"ogg"|"pcm"){
  const ffmpegUserAgentArgs = readable.type === "url" ? [
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
  const args = [
    ...ffmpegUserAgentArgs,
    ...ffmpegSeekArgs,
    "-i", readable.type === "readable" ? "-" : readable.url,
    ...FFmpegDefaultArgs,
    "-vn",
    ...outputArgs,
    "-ar", "48000",
    "-ac", "2",
    ...effectArgs,
  ];
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
