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

import type { IncomingMessage } from "http";
import type { Readable } from "stream";

import * as ytdl from "ytdl-core";

import { Util } from "../../Util";
import { createPassThrough } from "../../Util/general";

export function createChunkedYTStream(
  info: ytdl.videoInfo,
  format: ytdl.videoFormat,
  options: ytdl.downloadOptions,
  chunkSize: number = 512 * 1024,
) {
  const stream = Util.general.createPassThrough();
  let current = -1;
  const contentLength = Number(format.contentLength);
  if(contentLength < chunkSize){
    ytdl
      .downloadFromInfo(info, { format, ...options })
      .on("error", er => !stream.destroyed ? stream.destroy(er) : stream.emit("error", er))
      .pipe(stream);
    Util.logger.log("[AudioSource:youtube]Stream was created as single stream");
  }else{
    const pipeNextStream = () => {
      current++;
      let end = chunkSize * (current + 1) - 1;
      if(end >= contentLength) end = undefined;
      const nextStream = ytdl.downloadFromInfo(info, {
        format,
        ...options,
        range: {
          start: chunkSize * current,
          end,
        },
      });
      Util.logger.log(`[AudioSource:youtube]Stream #${current + 1} was created.`);
      nextStream
        .on("error", er => !stream.destroyed ? stream.destroy(er) : stream.emit("error", er))
        .pipe(stream, { end: end === undefined });
      if(end !== undefined){
        nextStream.on("end", () => {
          pipeNextStream();
        });
      }else{
        Util.logger.log(`[AudioSource:youtube]Last stream (total:${current + 1})`);
      }
    };
    pipeNextStream();
    Util.logger.log(
      `[AudioSource:youtube]Stream was created as partial stream. ${Math.ceil(
        (contentLength + 1) / chunkSize,
      )} streams will be created.`,
    );
  }
  return stream;
}

export function createRefreshableYTLiveStream(
  info: ytdl.videoInfo,
  url: string,
  options: ytdl.downloadOptions,
) {
  // set timeout to any miniget stream
  const setStreamNetworkTimeout = (_stream: Readable) => {
    _stream.on("response", (message: IncomingMessage) => {
      message.setTimeout(4000, () => {
        Util.logger.log("Segment timed out; retrying...");
        const er = new Error("ENOTFOUND");
        Object.defineProperty(er, "type", {
          value: "workaround",
        });
        message.destroy(er);
      });
    });
  };

  // start to download the live stream from the provided information (info object or url string)
  const downloadLiveStream = async (targetInfo: ytdl.videoInfo | string) => {
    if(typeof targetInfo === "string"){
      targetInfo = await ytdl.getInfo(targetInfo);
      options.format = ytdl.chooseFormat(targetInfo.formats, {
        isHLS: true,
      } as ytdl.chooseFormatOptions);
    }
    return ytdl.downloadFromInfo(
      targetInfo,
      Object.assign(
        {
          liveBuffer: 10000,
        },
        options,
      ),
    );
  };

  // handle errors occurred by the current live stream
  const onError = (er: Error) => {
    console.error(er);
    if(er.message === "ENOTFOUND"){
      refreshStream();
    }else{
      destroyCurrentStream(er);
      stream.destroy(er);
    }
  };

  // destroy the current stream safely
  const destroyCurrentStream = (er?: Error) => {
    currentStream.removeAllListeners("error");
    currentStream.on("error", () => {});
    currentStream.destroy(er);
  };

  // indicates if the stream is refreshing now or not.
  let refreshing = false;
  // re-create new stream to refresh instance
  const refreshStream = async () => {
    if(refreshing) return;
    try{
      refreshing = true;
      if(Util.config.debug) Util.logger.log("preparing new stream", "debug");
      const newStream = await downloadLiveStream(url);
      newStream.on("error", onError);
      setStreamNetworkTimeout(newStream);
      // wait until the stream is ready
      await new Promise((resolve, reject) =>
        newStream.once("readable", resolve).once("error", reject),
      );
      destroyCurrentStream();
      currentStream = newStream;
      currentStream.pipe(stream, {
        end: false,
      });
      if(Util.config.debug) Util.logger.log("piped new stream", "debug");
      refreshing = false;
    } catch(e){
      stream.destroy(e);
    }
  };

  let currentStream: Readable = null;
  const timeout = setInterval(refreshStream, 40 * 60 * 1000).unref();
  const stream = createPassThrough({
    allowHalfOpen: true,
    autoDestroy: false,
  });
  setImmediate(async () => {
    currentStream = await downloadLiveStream(info);
    currentStream.pipe(stream, {
      end: false,
    });
    currentStream.on("error", onError);
    setStreamNetworkTimeout(currentStream);
  }).unref();

  // finalize the stream to prevent memory leaks
  stream.once("close", () => {
    destroyCurrentStream();
    currentStream = null;
    clearInterval(timeout);
    Util.logger.log("Live refreshing schedule cleared");
  });

  return stream;
}
