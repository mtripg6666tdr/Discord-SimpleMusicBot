import * as ytdl from "ytdl-core";
import { InitPassThrough, log } from "../Util";

export function createChunkedYTStream(info:ytdl.videoInfo, format:ytdl.videoFormat, chunkSize:number = 512 * 1024){
  const stream = InitPassThrough();
  let current = -1;
  const contentLength = Number(format.contentLength);
  if(contentLength < chunkSize){
    ytdl.downloadFromInfo(info, {format})
    .on("error", er => stream.emit("error", er))
    .pipe(stream);
    log("[AudioSource:youtube]Stream was created as single stream")
  }else{
    const pipeNextStream = () => {
      current++;
      let end = chunkSize * (current + 1) - 1;
      if(end >= contentLength) end = undefined;
      const nextStream = ytdl.downloadFromInfo(info, {format, range: {
        start: chunkSize * current, end
      }});
      log("[AudioSource:youtube]Stream #" + current + " was created.");
      nextStream
        .on("error", er => stream.emit("error", er))
        .pipe(stream, {end: end === undefined});
      if(end !== undefined){
        nextStream.on("end", () => {
          pipeNextStream();
        });
      }else{
        log("[AudioSource:youtube]Last stream (total:" + current + ")");
      }
    };
    pipeNextStream();
  }
  return stream;
}