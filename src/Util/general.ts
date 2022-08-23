import { PassThrough } from "stream";

import { log } from "./log";

/**
 * 指定された文字列を指定された桁数になるまでゼロ補完します。
 * @param str 補完する文字列
 * @param length 補完後の長さ
 * @returns 保管された文字列
 */
export function AddZero(str:string, length:number){
  if(str.length >= length) return str;
  while(str.length < length){
    str = "0" + str;
  }
  return str;
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

/**
 * 空のPassThroughを生成します
 * @returns PassThrough
 */
export function InitPassThrough():PassThrough{
  const id = Date.now();
  log(`[PassThrough] initialized (id: ${id})`, "debug");
  const stream = new PassThrough({
    highWaterMark: 1024 * 512
  });
  stream._destroy = () => {
    // for debug purpose
    console.trace(`[PassThrough] destroyed (id: ${id})`);
    log(`[PassThrough] destroyed (id: ${id})`, "debug");
    stream.destroyed = true;
    stream.emit("close", []);
  };
  return stream;
}

export function waitForEnteringState(predicate:()=>boolean, timeout:number = 10 * 1000, options?:{
  rejectOnTimeout:boolean,
  timeStep:number,
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
    }, timeStep);
  });
}
