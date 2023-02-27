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

import * as crypto from "crypto";
import * as path from "path";
import { PassThrough } from "stream";

import config from "./config";
import { log } from "./log";

/**
 * 指定された文字列を指定された桁数になるまでゼロ補完します。
 * @param str 補完する文字列
 * @param length 補完後の長さ
 * @returns 保管された文字列
 */
export function padZero(str:string, length:number){
  if(str.length >= length) return str;
  return `${"0".repeat(length - str.length)}${str}`;
}

/**
 * 文字列をBase64エンコードします
 * @param txt エンコードする文字列
 * @returns Base64エンコードされた文字列
 */
export function btoa(txt:string){
  return Buffer.from(txt).toString("base64");
}

/**
 * オブジェクトを可能な限り文字列化します
 * @param obj 対象のオブジェクト
 * @returns 文字列。JSON、またはその他の文字列、および空の文字列の場合があります
 */
export function StringifyObject(obj:any):string{
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

const projectRoot = path.join(__dirname, "../../").slice(0, -1);

/**
 * 与えられた文字列に、ファイルパスが含まれている場合、それを隠します。
 * @param original 
 * @returns 
 */
export function FilterContent(original:string){
  let result = original;
  while(result.includes(projectRoot)){
    result = result.replace(projectRoot, "***");
  }
  result = result.replace(/https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+/g, "http:***");
  return result.replace(/\\/g, "/").replace(/\*/g, "\\*");
}

/**
 * 空のPassThroughを生成します
 * @returns PassThrough
 */
export function createPassThrough(opts:TransformOptions = {}):PassThrough{
  const id = Date.now();
  log(`[PassThrough] initialized (id: ${id})`, "debug");
  const stream = new PassThrough(Object.assign({
    highWaterMark: 1024 * 256,
    allowHalfOpen: false,
    emitClose: true,
    autoDestroy: true,
  }, opts));
  stream._destroy = () => {
    // for debug purpose
    log(`[PassThrough] destroyed (id: ${id})`, "debug");
    stream.destroyed = true;
    stream.emit("close");
  };
  return stream;
}

/**
 * 与えられた関数がtrueを返すまで待機します。
 * @param predicate 待機完了かどうかを判定する関数
 * @param timeout 待機時間の最大値（タイムアウト時間）。設定しない場合はInfinityとします。
 * @param options 追加の設定
 * @returns 
 */
export function waitForEnteringState(predicate:()=>boolean, timeout:number = 10 * 1000, options?:{
  /**
   * タイムアウトした際にエラーとするかどうかを表します。
   */
  rejectOnTimeout?:boolean,
  /**
   * 与えられた判定関数を呼ぶ時間間隔をミリ秒単位で指定します。
   */
  timeStep?:number,
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

/**
 * 指定された時間だけ非同期で待機します。
 * @param time 待機時間（ミリ秒単位）
 */
export function wait(time:number){
  return new Promise<void>(resolve => setTimeout(resolve, time).unref());
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
      return (cn ^ (crypto.randomBytes(1)[0] & (15 >> (cn / 4)))).toString(16);
    });
  }
}

export function isBotAdmin(userId:string){
  if(!config.adminId){
    return userId === "593758391395155978";
  }
  return typeof config.adminId === "string" ? config.adminId === userId : config.adminId.includes(userId);
}
