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

import type { Readable } from "stream";

import { spawn } from "child_process";
import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";

import candyget from "candyget";
import miniget from "miniget";

import Util from ".";
import { DefaultUserAgent } from "./ua";

/**
 * 指定されたURLからテキストデータをダウンロードします
 * @param url URL
 * @returns ダウンロードされたテキストデータ
 */
export function DownloadText(url: string, headers?: { [key: string]: string }, requestBody?: any): Promise<string>{
  return candyget.string(url, { headers }, requestBody).then(r => r.body);
}

/**
 * 指定されたURLにHEADリクエストをしてステータスコードを取得します
 * @param url URL
 * @param headers 追加のカスタムリクエストヘッダ
 * @returns ステータスコード
 */
export function RetriveHttpStatusCode(url: string, headers?: { [key: string]: string }){
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
export function DownloadAsReadable(url: string, options: miniget.Options = {}): Readable{
  return miniget(url, {
    maxReconnects: 10,
    maxRetries: 3,
    backoff: { inc: 500, max: 10000 },
    agent: url.startsWith("https:") ? httpsAgent : httpAgent,
    ...options,
  })
    .on("reconnect", () => Util.logger.log("Miniget is now trying to re-send a request due to failing"))
  ;
}

/**
 * URLからリソースの長さを秒数で取得します
 * @param url リソースのURL
 * @returns 取得された秒数
 */
export function RetriveLengthSeconds(url: string){
  return new Promise<number>((resolve, reject) => {
    let data = "";
    const proc = spawn(require("ffmpeg-static"), [
      "-i", url,
      "-user_agent", DefaultUserAgent
    ], {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"]
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
