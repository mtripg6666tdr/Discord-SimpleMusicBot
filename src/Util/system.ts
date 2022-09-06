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

import * as os from "os";

import { GetPercentage } from "./math";

/**
 * メモリ使用情報
 */
type MemoryUsageInfo = {free:number, total:number, used:number, usage:number};

/**
  * メモリ使用情報を取得します
  * @returns メモリ使用情報
  */
export function GetMemInfo():MemoryUsageInfo{
  const free = GetMBytes(os.freemem());
  const total = GetMBytes(os.totalmem());
  const used = total - free;
  const usage = GetPercentage(used, total);
  return {
    free,
    total,
    used,
    usage,
  };
}

/**
  * 指定されたバイト数をメガバイトに変換します
  * @param bytes 指定されたバイト
  * @returns 返還後のメガバイト数
  */
export function GetMBytes(bytes:number){
  return Math.round(bytes / 1024/*KB*/ / 1024/*MB*/ * 100) / 100;
}
