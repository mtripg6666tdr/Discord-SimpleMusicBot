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

import type { IncomingMessage } from "http";
import type { Readable } from "stream";

import * as distubeYtdl from "@distube/ytdl-core";
import * as ytdl from "ytdl-core";

import { assertIs, createFragmentalDownloadStream, createPassThrough } from "../../Util";
import { getLogger } from "../../logger";

const logger = getLogger("AudioSource:YouTubeStream");

export function createChunkedYTStream(info: ytdl.videoInfo, format: ytdl.videoFormat, options: ytdl.downloadOptions, chunkSize: number = 512 * 1024) {
  return createFragmentalDownloadStream(
    (start, end) => ytdl.downloadFromInfo(info, {
      format,
      ...options,
      range: { start, end },
    }),
    {
      chunkSize,
      contentLength: Number(format.contentLength),
    }
  );
}

export function createChunkedDistubeYTStream(
  info: distubeYtdl.videoInfo,
  format: distubeYtdl.videoFormat,
  options: distubeYtdl.downloadOptions,
  chunkSize: number = 8 * 1024 * 1024, // 8MB
) {
  const refreshInfo = async () => {
    info = await distubeYtdl.getInfo(info.videoDetails.video_url);

    const newFormat = info.formats.find(f => f.itag === format.itag);
    if (!newFormat) {
      stream.destroy(new Error("Failed to refresh the format"));
      return;
    }

    format = newFormat;
  };

  const stream = createFragmentalDownloadStream(
    async (start, end) => {
      await refreshInfo();
      return distubeYtdl.downloadFromInfo(info, { format, ...options, range: { start, end }, dlChunkSize: 0 });
    },
    {
      chunkSize,
      contentLength: Number(format.contentLength),
      pulseDownload: true,
    }
  );

  return stream;
}

export function createRefreshableYTLiveStream(info: ytdl.videoInfo | distubeYtdl.videoInfo, url: string, options: ytdl.downloadOptions | distubeYtdl.downloadOptions, distube: boolean = false) {
  // set timeout to any miniget stream
  const setStreamNetworkTimeout = (_stream: Readable) => {
    _stream.on("response", (message: IncomingMessage) => {
      message.setTimeout(4000, () => {
        logger.info("Segment timed out; retrying...");
        const er = new Error("ENOTFOUND");
        Object.defineProperty(er, "type", {
          value: "workaround",
        });
        message.destroy(er);
      });
    });
  };

  // start to download the live stream from the provided information (info object or url string)
  const downloadLiveStream = async (targetInfo: ytdl.videoInfo | distubeYtdl.videoInfo | string) => {
    if (typeof targetInfo === "string") {
      targetInfo = await ytdl.getInfo(targetInfo);
      options.format = ytdl.chooseFormat(targetInfo.formats, { isHLS: true } as ytdl.chooseFormatOptions);
    }

    if (distube) {
      assertIs<distubeYtdl.videoInfo>(targetInfo);
      assertIs<distubeYtdl.downloadOptions>(options);

      return distubeYtdl.downloadFromInfo(targetInfo, Object.assign({
        liveBuffer: 10000,
      }, options));
    } else {
      assertIs<ytdl.videoInfo>(targetInfo);
      assertIs<ytdl.downloadOptions>(options);

      return ytdl.downloadFromInfo(targetInfo, Object.assign({
        liveBuffer: 10000,
      }, options));
    }
  };

  // handle errors occurred by the current live stream
  const onError = (er: Error) => {
    console.error(er);
    if (er.message === "ENOTFOUND") {
      refreshStream().catch(onError);
    } else {
      destroyCurrentStream(er);
      stream.destroy(er);
    }
  };

  // destroy the current stream safely
  const destroyCurrentStream = (er?: Error) => {
    if (currentStream) {
      currentStream.removeAllListeners("error");
      currentStream.on("error", () => {});
      currentStream.destroy(er);
    }
  };

  // indicates if the stream is refreshing now or not.
  let refreshing = false;
  // re-create new stream to refresh instance
  const refreshStream = async () => {
    if (refreshing) return;
    try {
      refreshing = true;
      logger.debug("preparing new stream");
      const newStream = await downloadLiveStream(url);
      newStream.on("error", onError);
      setStreamNetworkTimeout(newStream);
      // wait until the stream is ready
      await new Promise((resolve, reject) => newStream.once("readable", resolve).once("error", reject));
      destroyCurrentStream();
      currentStream = newStream;
      currentStream.pipe(stream, {
        end: false,
      });
      logger.debug("piped new stream");
      refreshing = false;
    }
    catch (e) {
      stream.destroy(e);
    }
  };

  let currentStream: Readable | null = null;
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
    logger.debug("Live refreshing schedule cleared");
  });

  return stream;
}
