import type { StreamInfo } from "../../AudioSource";

import { FFmpeg } from "prism-media";

import { DefaultUserAgent, FFmpegDefaultArgs } from "../../definition";

export function transformThroughFFmpeg(readable:StreamInfo, effectArgs:string, seek:number, output:"ogg"|"pcm"){
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
  const ffmpeg = new FFmpeg({
    args: [
      ...FFmpegDefaultArgs,
      ...ffmpegUserAgentArgs,
      ...ffmpegSeekArgs,
      "-i", readable.type === "readable" ? "-" : readable.url,
      "-vn",
      ...outputArgs,
      "-ar", "48000",
      "-ac", "2",
      ...effectArgs
    ]
  });
  if(readable.type === "readable"){
    readable.stream
      .on("error", e => ffmpeg.destroyed ? ffmpeg.destroy(e) : ffmpeg.emit("error", e))
      .pipe(ffmpeg)
      .on("close", () => !ffmpeg.destroyed && ffmpeg.destroy())
    ;
  }
  return ffmpeg;
}
