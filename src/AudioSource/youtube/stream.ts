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

import type { Stream } from "@mtripg6666tdr/m3u8stream";
import type { IncomingMessage } from "http";
import type { Readable } from "stream";

import * as ytdl from "ytdl-core";

import { Util } from "../../Util";

export function createChunkedYTStream(info:ytdl.videoInfo, format:ytdl.videoFormat, options:ytdl.downloadOptions, chunkSize:number = 512 * 1024){
  const stream = Util.general.createPassThrough();
  let current = -1;
  const contentLength = Number(format.contentLength);
  if(contentLength < chunkSize){
    ytdl.downloadFromInfo(info, {format, ...options})
      .on("error", er => !stream.destroyed ? stream.destroy(er) : stream.emit("error", er))
      .pipe(stream)
    ;
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
        .on("error", er => !stream.destroyed ? stream.destroy(er) : stream.emit("error", er))
        .pipe(stream, {end: end === undefined})
      ;
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

export function createRefreshableYTLiveStream(info:ytdl.videoInfo, options:ytdl.downloadOptions, refresher:() => Promise<string>){
  const stream = ytdl.downloadFromInfo(info, Object.assign({
    liveBuffer: 40000,
  }, options)) as Readable & {updatePlaylist: Stream["updatePlaylist"]};
  stream.on("response", (message:IncomingMessage) => {
    message.setTimeout(4000, () => {
      message.destroy(new Error("ENOTFOUND"));
    });
  });
  let timeout:NodeJS.Timeout = null;
  stream.once("modified", () => {
    timeout = setInterval(async () => {
      if(stream.destroyed){
        clearInterval(timeout);
      }else{
        stream.updatePlaylist(await refresher());
        Util.logger.log("playlist updated");
      }
    }, 60 * 60 * 1000);
  });
  stream.once("close", () => {
    clearInterval(timeout);
    timeout = null;
    Util.logger.log("set interval cleared!");
  });
  return stream;
}
