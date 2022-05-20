import { PassThrough } from "stream";

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
  if(typeof obj === "string") return obj;
  if(obj["message"]) return obj.message;
  try{
    return JSON.stringify(obj);
  }
  catch{
    try{
      return Object.prototype.toString.call(obj);
    }
    catch{
      return "";
    }
  }
}

/**
 * 空のPassThroughを生成します
 * @returns PassThrough
 */
export function InitPassThrough():PassThrough{
  const stream = new PassThrough({
    highWaterMark: 1024 * 512
  });
  stream._destroy = () => { 
    stream.destroyed = true;
    stream.emit("close", []);
  };
  return stream;
}