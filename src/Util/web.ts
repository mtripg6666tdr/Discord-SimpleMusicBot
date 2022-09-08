/*
 * Copyright 2021-2022 mtripg6666tdr
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
import * as http from "http";
import * as https from "https";

import * as miniget from "miniget";

import Util from ".";
import { DefaultUserAgent } from "./ua";

/**
 * 指定されたURLからテキストデータをダウンロードします
 * @param url URL
 * @returns ダウンロードされたテキストデータ
 */
export function DownloadText(url:string, headers?:{[key:string]:string}, requestBody?:any):Promise<string>{
  return new Promise((resolve, reject)=>{
    const durl = new URL(url);
    const req = ({
      "https:": https,
      "http:": http
    })[durl.protocol].request({
      protocol: durl.protocol,
      hostname: durl.hostname,
      port: durl.port,
      path: durl.pathname + durl.search + durl.hash,
      method: requestBody ? "POST" : "GET",
      headers: headers ?? undefined
    }, res => {
      const bufs = [] as Buffer[];
      res.on("data", chunk => bufs.push(chunk));
      res.on("end", ()=>{
        resolve(Buffer.concat(bufs).toString());
      });
      res.on("error", reject);
    }).on("error", (er) => {
      reject(er);
      if(!req.destroyed) req.destroy();
    });
    req.end(requestBody || undefined);
  });
}

/**
 * 指定されたURLにHEADリクエストをしてステータスコードを取得します
 * @param url URL
 * @param headers 追加のカスタムリクエストヘッダ
 * @returns ステータスコード
 */
export function RetriveHttpStatusCode(url:string, headers?:{[key:string]:string}){
  return new Promise<number>((resolve, reject) => {
    const durl = new URL(url);
    const req = ({
      "https:": https,
      "http:": http
    })[durl.protocol].request({
      protocol: durl.protocol,
      hostname: durl.hostname,
      path: durl.pathname,
      port: durl.port,
      method: "HEAD",
      headers: {
        "User-Agent": DefaultUserAgent,
        ...(headers ?? {})
      }
    }, (res) => {
      resolve(res.statusCode);
    })
      .on("error", (er) => {
        reject(er);
        if(!req.destroyed) req.destroy();
      })
      .end()
    ;
  });
}

/**
 * 指定されたURLからReadable Streamを生成します
 * @param url URL
 * @returns Readableストリーム
 */
export function DownloadAsReadable(url:string, options:miniget.Options = {}):Readable{
  return miniget.default(url, {
    maxReconnects: 10,
    maxRetries: 3,
    backoff: { inc: 500, max: 10000 },
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
export function RetriveLengthSeconds(url:string){
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
