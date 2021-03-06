import * as https from "https";
import * as http from "http";
import { Readable } from "stream";
import { spawn } from "child_process";
import * as miniget from "miniget";
import { InitPassThrough } from "./general";
import { DefaultUserAgent } from "./ua";

/**
 * 指定されたURLからテキストデータをダウンロードします
 * @param url URL
 * @returns ダウンロードされたテキストデータ
 */
export function DownloadText(url:string, headers?:{[key:string]:string}, requestBody?:any):Promise<string>{
  return new Promise((resolve,reject)=>{
    const durl = new URL(url);
    const req = ({
      "https:": https, 
      "http:": http
    })[durl.protocol].request({
      protocol: durl.protocol,
      host: durl.host,
      path: durl.pathname + durl.search + durl.hash,
      method: requestBody ? "POST" : "GET",
      headers: headers ?? undefined
    }, res => {
      let data = "";
      res.on("data", chunk =>{
        data += chunk;
      });
      res.on("end", ()=>{
        resolve(data);
      });
      res.on("error", reject);
    }).on("error", (er) => {
      reject(er);
      if(!req.destroyed) req.destroy();
    });
    req.end(requestBody ?? undefined);
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
      host: durl.hostname,
      path: durl.pathname,
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
  })
}

/**
 * 指定されたURLからReadable Streamを生成します
 * @param url URL
 * @returns Readableストリーム
 */
export function DownloadAsReadable(url:string):Readable{
  const stream = InitPassThrough();
  const req = miniget.default(url, {
    maxReconnects: 6,
    maxRetries: 3,
    backoff: { inc: 500, max: 10000 },
  });
  req.on("error", (e)=>{
    stream.emit("error",e);
  }).pipe(stream);
  return stream;
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
          const lengthSec = match.groups["length"]
            .split(":")
            .map(n => Number(n))
            .reduce((prev, current) => prev * 60 + current)
            ;
          resolve(Math.ceil(lengthSec));
        } else {
          reject("not match");
        }
      });
    proc.stderr.on("data", (chunk) => {
      data += chunk;
    });
  });
}