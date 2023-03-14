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

import type { TransformOptions } from "stream";
import type { Readable } from "stream";

import { spawn } from "child_process";
import * as crypto from "crypto";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import { PassThrough } from "stream";

import candyget from "candyget";
import miniget from "miniget";

import { DefaultUserAgent } from "../definition";
import { getLogger } from "../logger";

export * as color from "./color";
export * as discordUtil from "./discord";
export * as effectUtil from "./effect";
export * as system from "./system";
export * as time from "./time";

/**
 * 指定された文字列を指定された桁数になるまでゼロ補完します。
 * @param str 補完する文字列
 * @param length 補完後の長さ
 * @returns 保管された文字列
 */
export function padZero(str: string, length: number){
  if(str.length >= length) return str;
  return `${"0".repeat(length - str.length)}${str}`;
}

/**
 * 文字列をBase64エンコードします
 * @param txt エンコードする文字列
 * @returns Base64エンコードされた文字列
 */
export function btoa(txt: string){
  return Buffer.from(txt).toString("base64");
}

/**
 * オブジェクトを可能な限り文字列化します
 * @param obj 対象のオブジェクト
 * @returns 文字列。JSON、またはその他の文字列、および空の文字列の場合があります
 */
export function stringifyObject(obj: any): string{
  if(typeof obj === "string"){
    return obj;
  }else if(obj instanceof Error){
    return `${obj.name}: ${obj.message}\n${obj.stack || "no stacks"}`;
  }else if(obj["message"]){
    return obj.message;
  }else{
    try{
      return JSON.stringify(obj);
    }
    catch{
      return Object.prototype.toString.call(obj);
    }
  }
}

/**
 * 空のPassThroughを生成します
 * @returns PassThrough
 */
export function createPassThrough(opts: TransformOptions = {}): PassThrough{
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

const UUID_TEMPLATE = "10000000-1000-4000-8000-100000000000";
/**
 * UUIDを生成します
 * @returns 生成されたUUID
 */
export function generateUUID(){
  if(typeof crypto.randomUUID === "function"){
    return crypto.randomUUID();
  }else{
    // ref: https://www.30secondsofcode.org/js/s/uuid-generator-node
    return UUID_TEMPLATE.replace(/[018]/g, c => {
      const cn = Number(c);
      return (cn ^ crypto.randomBytes(1)[0] & 15 >> cn / 4).toString(16);
    });
  }
}

/**
 * パーセンテージを計算します
 * @param part 計算対象の量
 * @param total 合計量
 * @returns 計算後のパーセンテージ
 */
export function getPercentage(part: number, total: number){
  return Math.round(part / total * 100 * 100) / 100;
}

const audioExtensions = [
  ".mp3",
  ".wav",
  ".wma",
  ".mov",
  ".mp4",
  ".ogg",
  ".m4a",
  ".webm",
] as const;
/**
 * ローオーディオファイルのURLであるかどうかをURLの末尾の拡張子から判断します
 * @param str 検査対象のURL
 * @returns ローオーディオファイルのURLであるならばtrue、それ以外の場合にはfalse
 */
export function isAvailableRawAudioURL(str: string){
  return str && audioExtensions.some(ext => str.endsWith(ext));
}

/**
 * 指定されたURLにHEADリクエストをしてステータスコードを取得します
 * @param url URL
 * @param headers 追加のカスタムリクエストヘッダ
 * @returns ステータスコード
 */
export function retriveHttpStatusCode(url: string, headers?: { [key: string]: string }){
  return candyget("HEAD", url, "string", {
    headers: {
      "User-Agent": DefaultUserAgent,
      ...headers,
    },
  }).then(r => r.statusCode);
}

const httpAgent = new HttpAgent({ keepAlive: false });
const httpsAgent = new HttpsAgent({ keepAlive: false });

/**
 * 指定されたURLからReadable Streamを生成します
 * @param url URL
 * @returns Readableストリーム
 */
export function downloadAsReadable(url: string, options: miniget.Options = {}): Readable{
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

/**
 * URLからリソースの長さを秒数で取得します
 * @param url リソースのURL
 * @returns 取得された秒数
 */
export function retriveLengthSeconds(url: string){
  return retrieveLengthSecondsInternal(url, () => require("ffmpeg-static")).catch(() => {
    return retrieveLengthSecondsInternal(url, () => "ffmpeg");
  });
}

function retrieveLengthSecondsInternal(url: string, ffmpeg: () => string){
  return new Promise<number>((resolve, reject) => {
    let data = "";
    const proc = spawn(ffmpeg(), [
      "-i", url,
      "-user_agent", DefaultUserAgent,
    ], {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"],
    })
      .on("exit", () => {
        if(data.length === 0) reject("zero");
        const match = data.match(/Duration: (?<length>(\d+:)*\d+(\.\d+)?),/i);
        if(match){
          const lengthSec = match.groups.length
            .split(":")
            .map(n => Number(n))
            .reduce((prev, current) => prev * 60 + current)
            ;
          resolve(Math.ceil(lengthSec));
        }else{
          reject("not match");
        }
      });
    proc.stderr.on("data", (chunk) => {
      data += chunk;
    });
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
] as const;

/**
 * 文字列を正規化します
 */
export function normalizeText(rawText: string){
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
   * タイムアウトした際にエラーとするかどうかを表します。
   */
  rejectOnTimeout?: boolean,
  /**
   * 与えられた判定関数を呼ぶ時間間隔をミリ秒単位で指定します。
   */
  timeStep?: number,
}){
  const { rejectOnTimeout, timeStep } = Object.assign({
    rejectOnTimeout: true,
    timeStep: 50,
  }, options);
  return new Promise<number>((resolve, reject) => {
    let count = 0;
    const startTime = Date.now();
    if(predicate()){
      resolve(0);
    }else if(timeout < 50){
      reject("timed out");
    }
    const ticker = setInterval(() => {
      count++;
      if(predicate()){
        clearInterval(ticker);
        resolve(Date.now() - startTime);
      }else if(timeout <= timeStep * count){
        clearInterval(ticker);
        if(rejectOnTimeout){
          reject(`target predicate has not return true in time (${timeout}ms) and timed out`);
        }
        else{
          resolve(Date.now() - startTime);
        }
      }
    }, timeStep).unref();
  });
}
