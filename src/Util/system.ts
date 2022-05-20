import * as os from "os";
import { GetPercentage } from "./math";

/**
 * メモリ使用情報
 */
type MemoryUsageInfo = {free:number,total:number,used:number,usage:number};

/**
  * メモリ使用情報を取得します
  * @returns メモリ使用情報
  */
export function GetMemInfo():MemoryUsageInfo{
  let memory = {} as MemoryUsageInfo;
  memory.free = GetMBytes(os.freemem());
  memory.total = GetMBytes(os.totalmem());
  memory.used = memory.total - memory.free;
  memory.usage = GetPercentage(memory.used, memory.total);
  return memory;
}

/**
  * 指定されたバイト数をメガバイトに変換します
  * @param bytes 指定されたバイト
  * @returns 返還後のメガバイト数
  */
export function GetMBytes(bytes:number) {
  return Math.round(bytes / 1024/*KB*/ / 1024/*MB*/ * 100) / 100;
} 