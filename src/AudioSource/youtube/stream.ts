import * as ytdl from "ytdl-core";

import { Util } from "../../Util";

export function createChunkedYTStream(info:ytdl.videoInfo, format:ytdl.videoFormat, options:ytdl.downloadOptions, chunkSize:number = 512 * 1024){
  const stream = Util.general.InitPassThrough();
  let current = -1;
  const contentLength = Number(format.contentLength);
  if(contentLength < chunkSize){
    ytdl.downloadFromInfo(info, {format, ...options})
      .on("error", er => stream.emit("error", er))
      .pipe(stream);
    Util.logger.log("[AudioSource:youtube]Stream was created as single stream");
  }else{
    const pipeNextStream = () => {
      current++;
      let end = chunkSize * (current + 1) - 1;
      if(end >= contentLength) end = undefined;
      const nextStream = ytdl.downloadFromInfo(info, {format, ...options, range: {
        start: chunkSize * current, end
      }});
      Util.logger.log(`[AudioSource:youtube]Stream #${(current + 1)} was created.`);
      nextStream
        .on("error", er => stream.emit("error", er))
        .pipe(stream, {end: end === undefined});
      if(end !== undefined){
        nextStream.on("end", () => {
          pipeNextStream();
        });
      }else{
        Util.logger.log(`[AudioSource:youtube]Last stream (total:${(current + 1)})`);
      }
    };
    pipeNextStream();
    Util.logger.log(`[AudioSource:youtube]Stream was created as partial stream. ${Math.ceil((contentLength + 1) / chunkSize)} streams will be created.`);
  }
  return stream;
}
