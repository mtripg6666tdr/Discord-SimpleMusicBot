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

import type { TransformOptions } from "stream";
import type { Readable } from "stream";

import { spawn } from "child_process";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import { PassThrough } from "stream";

import candyget from "candyget";
import miniget from "miniget";
import { debounce } from "throttle-debounce";

import { destroyStream } from "../Util/stream";
import { DefaultUserAgent, SecondaryUserAgent } from "../definition";
import { getLogger } from "../logger";

export * as color from "./color";
export * as discordUtil from "./discord";
export * as system from "./system";
export * as time from "./time";

/**
 * オブジェクトを可能な限り文字列化します
 * @param obj 対象のオブジェクト
 * @returns 文字列。JSON、またはその他の文字列、および空の文字列の場合があります
 */
export function stringifyObject(obj: any): string {
  if (!obj) {
    return "null";
  } else if (typeof obj === "string") {
    return obj;
  } else if (obj instanceof Error) {
    return `${obj.name}: ${obj.message}\n${obj.stack || "no stacks"}`;
  } else if (obj["message"]) {
    return obj.message;
  } else {
    try {
      return JSON.stringify(obj);
    }
    catch {
      return Object.prototype.toString.call(obj);
    }
  }
}

/**
 * 与えられた文字列に、ファイルパスが含まれている場合、それを隠します。
 * @param original 元の文字列
 * @returns フィルター後の文字列
 */
export function filterContent(original: string) {
  const cwd = process.cwd();
  return original
    .replaceAll(cwd, "***")
    .replace(/https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+/g, "http:***")
    .replace(/\\/g, "/")
    .replace(/\*/g, "\\*");
}

/**
 * 空のPassThroughを生成します
 * @returns PassThrough
 */
export function createPassThrough(opts: TransformOptions = {}): PassThrough {
  const logger = getLogger("PassThrough");
  const id = Date.now();
  logger.debug(`initialized (id: ${id})`);
  const stream = new PassThrough(Object.assign({
    highWaterMark: 1024 * 256,
    allowHalfOpen: false,
    emitClose: true,
    autoDestroy: true,
  }, opts));
  stream._destroy = (er, callback) => {
    // for debug purpose
    logger.debug(`destroyed (id: ${id})`);
    stream.destroyed = true;
    callback(er);
  };
  return stream;
}

/**
 * パーセンテージを計算します
 * @param part 計算対象の量
 * @param total 合計量
 * @returns 計算後のパーセンテージ
 */
export function getPercentage(part: number, total: number) {
  return Math.round(part / total * 100 * 100) / 100;
}

const audioExtensions = [
  ".mp3",
  ".wav",
  ".wma",
  ".ogg",
  ".m4a",
  ".webm",
  ".flac",
] as const;
const videoExtensions = [
  ".mov",
  ".mp4",
  ".webm",
];
type ResourceType = "none" | "audio" | "video";
/**
 * ローオーディオファイルのURLであるかどうかをURLの末尾の拡張子から判断します。
 * @param url 検査対象のURL
 * @returns ローオーディオファイルのURLであるならばtrue、それ以外の場合にはfalse
 */
export function getResourceTypeFromUrl(url: string | null): ResourceType;
/**
 * ローオーディオファイルのURLであるかどうかをURLの末尾の拡張子から判断します。
 * @param url 検査対象のURL
 * @param param1 追加の設定。checkResponseがtrueの場合は、リクエストを送信してレスポンスのContent-Typeを確認します。
 * @returns ローオーディオファイルのURLであるならばtrue、それ以外の場合にはfalse
 */
export function getResourceTypeFromUrl(url: string | null, { checkResponse }: { checkResponse: false }): ResourceType;
/**
 * ローオーディオファイルのURLであるかどうかをURLの末尾の拡張子から判断します。
 * @param url 検査対象のURL
 * @param param1 追加の設定。checkResponseがtrueの場合は、リクエストを送信してレスポンスのContent-Typeを確認します。
 * @returns ローオーディオファイルのURLであるならばtrue、それ以外の場合にはfalse
 */
export function getResourceTypeFromUrl(url: string | null, { checkResponse }: { checkResponse: true }): Promise<ResourceType>;
export function getResourceTypeFromUrl(url: string | null, { checkResponse = false } = {}): ResourceType | Promise<ResourceType> {
  // check if the url variable is valid string object.
  if (!url || typeof url !== "string") {
    return "none";
  }

  const urlObject = new URL(url);

  // check if the url has a valid protocol and if its pathname ends with a valid extension.
  const urlIsHttp = urlObject.protocol === "http:" || urlObject.protocol === "https:";

  if (!urlIsHttp) {
    return "none";
  }

  const typeInferredFromUrl: ResourceType = videoExtensions.some(ext => urlObject.pathname.endsWith(ext))
    ? "video"
    : audioExtensions.some(ext => urlObject.pathname.endsWith(ext))
      ? "audio"
      : "none";

  if (!checkResponse || typeInferredFromUrl === "none") {
    return typeInferredFromUrl;
  }

  return requestHead(url).then(({ headers }) =>
    headers["content-type"]?.startsWith(`${typeInferredFromUrl}/`) ? typeInferredFromUrl : "none"
  );
}

/**
 * 指定されたURLにHEADリクエストをしてステータスコードを取得します
 * @param url URL
 * @param headers 追加のカスタムリクエストヘッダ
 * @returns ステータスコード
 */
export function retrieveHttpStatusCode(url: string, headers?: { [key: string]: string }) {
  return requestHead(url, headers).then(d => d.statusCode);
}

/**
 * 指定されたURLにHEADリクエストを行います。
 * @param url URL
 * @param headers 追加のカスタムリクエストヘッダ
 * @returns レスポンス
 */
export function requestHead(url: string, headers: { [key: string]: string } = {}) {
  return candyget("HEAD", url, "string", {
    headers: {
      "User-Agent": DefaultUserAgent,
      ...headers,
    },
    maxRedirects: 0,
  });
}

const httpAgent = new HttpAgent({ keepAlive: false });
const httpsAgent = new HttpsAgent({ keepAlive: false });

/**
 * 指定されたURLからReadable Streamを生成します
 * @param url URL
 * @returns Readableストリーム
 */
export function downloadAsReadable(url: string, options: miniget.Options = { headers: { "User-Agent": DefaultUserAgent } }): Readable {
  const logger = getLogger("Util");
  return miniget(url, {
    maxReconnects: 10,
    maxRetries: 3,
    backoff: { inc: 500, max: 10000 },
    agent: url.startsWith("https:") ? httpsAgent : httpAgent,
    ...options,
  })
    .on("reconnect", () => logger.warn("Miniget is now trying to re-send a request due to failing"))
  ;
}

type RemoteAudioInfo = {
  lengthSeconds: number | null,
  title: string | null,
  artist: string | null,
  displayTitle: string | null,
};
const durationMatcher = /^\s+Duration: (?<length>(\d+:)*\d+(\.\d+)?),/m;
const titleMatcher = /^\s+title\s+:(?<title>.+)$/m;
const artistMatcher = /^\s+artist\s+:(?<artist>.+)$/m;
/**
 * URLからリモートのオーディオリソースの情報を取得します
 * @param url リソースのURL
 * @returns 取得されたリソースの情報
 */
export async function retrieveRemoteAudioInfo(url: string): Promise<RemoteAudioInfo> {
  // FFmpegに食わせて標準出力を取得する
  const ffmpegOut = await retrieveFFmpegStderrFromUrl(url, () => require("ffmpeg-static"))
    .catch(er => {
      getLogger("Util").info(`Failed: ${stringifyObject(er)}`);
      return retrieveFFmpegStderrFromUrl(url, () => "ffmpeg");
    });

  const result: RemoteAudioInfo = {
    lengthSeconds: null,
    title: null,
    artist: null,
    displayTitle: null,
  };

  if (!ffmpegOut) {
    return result;
  } else if (ffmpegOut.includes("HTTP error")) {
    throw new Error("Failed to fetch data due to HTTP error.");
  }

  if (durationMatcher.test(ffmpegOut)) {
    const match = durationMatcher.exec(ffmpegOut)!;
    result.lengthSeconds = Math.ceil(
      match.groups!.length
        .split(":")
        .map(n => Number(n))
        .reduce((prev, current) => prev * 60 + current)
    ) || null;
  }

  if (titleMatcher.test(ffmpegOut)) {
    const match = titleMatcher.exec(ffmpegOut)!;

    result.title = match.groups!.title?.trim() || null;
  }

  if (artistMatcher.test(ffmpegOut)) {
    const match = artistMatcher.exec(ffmpegOut)!;

    result.artist = match.groups!.artist?.trim() || null;
  }

  // construct displayTitle
  if (result.title) {
    result.displayTitle = result.artist
      ? `${result.artist} - ${result.title}`
      : result.title;
  }

  return result;
}

function retrieveFFmpegStderrFromUrl(url: string, ffmpegPathGenerator: () => string) {
  return new Promise<string>((resolve, reject) => {
    const ffmpegPath = ffmpegPathGenerator();
    let data = "";
    const proc = spawn(ffmpegPath, [
      "-i", url,
      "-user_agent", DefaultUserAgent,
    ], {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"],
    })
      .on("exit", () => {
        if (data.length === 0) {
          reject(new Error("FFmpeg emit nothing."));
        }

        resolve(data);
      });
    proc.stderr.on("data", chunk => data += chunk);
  });
}

const normalizeTemplate = [
  { from: /０/g, to: "0" } as const,
  { from: /１/g, to: "1" } as const,
  { from: /２/g, to: "2" } as const,
  { from: /３/g, to: "3" } as const,
  { from: /４/g, to: "4" } as const,
  { from: /５/g, to: "5" } as const,
  { from: /６/g, to: "6" } as const,
  { from: /７/g, to: "7" } as const,
  { from: /８/g, to: "8" } as const,
  { from: /９/g, to: "9" } as const,
  // eslint-disable-next-line no-irregular-whitespace
  { from: /　/g, to: " " } as const,
  { from: /！/g, to: "!" } as const,
  { from: /？/g, to: "?" } as const,
  { from: /ｂ/g, to: "b" } as const,
  { from: /ｃ/g, to: "c" } as const,
  { from: /ｄ/g, to: "d" } as const,
  { from: /ｆ/g, to: "f" } as const,
  { from: /ｇ/g, to: "g" } as const,
  { from: /ｈ/g, to: "h" } as const,
  { from: /ｊ/g, to: "j" } as const,
  { from: /ｋ/g, to: "k" } as const,
  { from: /ｌ/g, to: "l" } as const,
  { from: /ｍ/g, to: "m" } as const,
  { from: /ｎ/g, to: "n" } as const,
  { from: /ｐ/g, to: "p" } as const,
  { from: /ｑ/g, to: "q" } as const,
  { from: /ｒ/g, to: "r" } as const,
  { from: /ｓ/g, to: "s" } as const,
  { from: /ｔ/g, to: "t" } as const,
  { from: /ｖ/g, to: "v" } as const,
  { from: /ｗ/g, to: "w" } as const,
  { from: /ｘ/g, to: "x" } as const,
  { from: /ｙ/g, to: "y" } as const,
  { from: /ｚ/g, to: "z" } as const,
  { from: /＞/g, to: ">" } as const,
  { from: /＜/g, to: "<" } as const,
] as const;

/**
 * 文字列を正規化します
 */
export function normalizeText(rawText: string) {
  let result = rawText;
  normalizeTemplate.forEach(reg => {
    result = result.replace(reg.from, reg.to);
  });
  return result;
}

/**
 * 与えられた関数がtrueを返すまで待機します。
 * @param predicate 待機完了かどうかを判定する関数
 * @param timeout 待機時間の最大値（タイムアウト時間）。設定しない場合はInfinityとします。
 * @param options 追加の設定
 * @returns 
 */
export function waitForEnteringState(predicate: () => boolean, timeout: number = 10 * 1000, options?: {
  /**
   * タイムアウトした際にエラーとするかどうかを表します。デフォルトではエラーとなります。
   */
  rejectOnTimeout?: boolean,
  /**
   * 与えられた判定関数を呼ぶ時間間隔をミリ秒単位で指定します。
   */
  timeStep?: number,
}) {
  const { rejectOnTimeout, timeStep } = Object.assign({
    rejectOnTimeout: true,
    timeStep: 50,
  }, options);
  return new Promise<number>((resolve, reject) => {
    let count = 0;
    const startTime = Date.now();
    if (predicate()) {
      resolve(0);
    } else if (timeout < 50) {
      reject("timed out");
    }
    const ticker = setInterval(() => {
      count++;
      if (predicate()) {
        clearInterval(ticker);
        resolve(Date.now() - startTime);
      } else if (timeout <= timeStep * count) {
        clearInterval(ticker);
        if (rejectOnTimeout) {
          reject(`target predicate has not return true in time (${timeout}ms) and timed out`);
        }
        else {
          resolve(Date.now() - startTime);
        }
      }
    }, timeStep).unref();
  });
}

export function createDebounceFunctionsFactroy<Key>(func: (key: Key) => void, debounceDelay: number) {
  // eslint-disable-next-line func-call-spacing
  const functionsStore = new Map<Key, () => void>();
  return (key: Key) => {
    if (functionsStore.has(key)) {
      return functionsStore.get(key)!;
    } else {
      const fn = debounce(debounceDelay, () => func(key));
      functionsStore.set(key, fn);
      return fn;
    }
  };
}

type FragmentalDownloadStreamOptions = {
  contentLength: number,
  chunkSize?: number,
  userAgent?: string,
  pulseDownload?: boolean,
};

export function createFragmentalDownloadStream(
  streamGenerator: string | ((start: number, end?: number) => Readable) | ((start: number, end?: number) => PromiseLike<Readable>),
  {
    contentLength,
    chunkSize = 512 * 1024,
    userAgent = SecondaryUserAgent,
    pulseDownload = false,
  }: FragmentalDownloadStreamOptions,
) {
  const logger = getLogger("FragmentalDownloader", true);
  logger.addContext("id", Date.now());

  const stream = createPassThrough();

  setImmediate(async () => {
    let current = -1;

    if (contentLength < chunkSize) {
      const originStream = typeof streamGenerator === "string"
        ? downloadAsReadable(streamGenerator, {
          headers: {
            "User-Agent": userAgent,
          },
        })
        : await streamGenerator(0);

      if (pulseDownload) {
        const pulseBuffer = createPassThrough({ highWaterMark: Math.floor(chunkSize * 1.2) });

        originStream
          .on("request", logger.trace)
          .on("response", res => res.once("close", () => logger.trace("Response closed")))
          .on("end", () => logger.trace("Origin stream ended"))
          .on("error", er => destroyStream(pulseBuffer, er))
          .pipe(pulseBuffer)
          .on("error", er => destroyStream(stream, er))
          .once("close", () => destroyStream(originStream))
          .pipe(stream)
          .once("close", () => destroyStream(pulseBuffer));
      } else {
        originStream
          .on("request", logger.trace)
          .on("response", res => res.once("close", () => logger.trace("Response closed")))
          .on("end", () => logger.trace("Origin stream ended"))
          .on("error", er => stream.destroy(er))
          .pipe(stream);
      }

      logger.info(`Stream was created as a single stream. (buffer: ${chunkSize} / content length: ${contentLength})`);
    } else {
      const pipeNextStream = async () => {
        current++;

        let end: number | undefined = chunkSize * (current + 1) - 1;

        if (end >= contentLength) {
          end = undefined;
        }

        const nextStream = typeof streamGenerator === "string"
          ? downloadAsReadable(streamGenerator, {
            headers: {
              "User-Agent": userAgent,
              "Range": `bytes=${chunkSize * current}-${end ? end : ""}`,
            },
          })
          : await streamGenerator(chunkSize * current, end);
        logger.info(`Stream #${current + 1} was created`);

        let pulseBuffer: PassThrough | null = null;

        if (pulseDownload) {
          pulseBuffer = createPassThrough({ highWaterMark: Math.floor(chunkSize * 1.2) });

          nextStream
            .on("request", logger.trace)
            .on("response", res => res.once("close", () => logger.trace("Response closed")))
            .on("end", () => logger.trace("Origin stream ended"))
            .on("error", er => destroyStream(pulseBuffer!, er))
            .pipe(pulseBuffer)
            .on("error", er => destroyStream(stream, er))
            .once("close", () => destroyStream(nextStream))
            .pipe(stream, { end: end === undefined })
            .once("close", () => destroyStream(pulseBuffer!));
        } else {
          nextStream
            .on("request", logger.trace)
            .on("response", res => res.once("close", () => logger.trace("Response closed")))
            .on("end", () => logger.trace("Origin stream ended"))
            .on("error", er => destroyStream(stream, er))
            .pipe(stream, { end: end === undefined })
            .once("close", () => destroyStream(nextStream));
        }

        if (end !== undefined) {
          (pulseBuffer || nextStream).on("end", () => pipeNextStream());
        } else {
          logger.info(`Last stream (total: ${current + 1})`);
        }
      };

      pipeNextStream().catch(logger.warn);

      logger.info(`Stream was created as partial stream. ${Math.ceil(contentLength / chunkSize)} streams will be created.`);
    }
  });
  return stream;
}

export function requireIfAny(id: string): unknown {
  try {
    return require(id);
  }
  catch (e) {
    const logger = getLogger("Util");

    logger.info(`The module "${id}" couldn't be loaded because of the error: ${stringifyObject(e)}`);

    return null;
  }
}

export function assertIs<T>(obj: unknown): asserts obj is T {}

export function assertIsNotNull<T>(obj: T | null): asserts obj is T {}
