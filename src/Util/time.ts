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

import { performance } from "perf_hooks";

import { AddZero } from "./general";
import { log } from "./log";

/**
 * 合計時間(秒)からゼロ補完された分および秒を計算します。
 * @param _t 合計時間(秒)
 * @returns [ゼロ補完された分,ゼロ補完された秒]
 */
export function CalcMinSec(_t:number){
  const sec = _t % 60;
  const min = (_t - sec) / 60;
  return [AddZero(min.toString(), 2), AddZero(sec.toString(), 2)];
}

/**
 * 合計時間(秒)から時間、ゼロ補完された分および秒を計算します。
 * @param seconds 合計時間(秒)
 * @returns [時間, ゼロ補完された分, ゼロ補完された秒]
 */
export function CalcHourMinSec(seconds:number){
  const sec = seconds % 60;
  const min = (seconds - sec) / 60 % 60;
  const hor = ((seconds - sec) / 60 - min) / 60;
  return [hor.toString(), AddZero(min.toString(), 2), AddZero(sec.toString(), 2)];
}

// Returns hour, min, sec and millisec from total millisec
/**
 * 合計時間(ミリ秒)から時間,分,秒,ミリ秒を計算します。
 * @param date 合計時間(ミリ秒)
 * @returns [時間,分,秒,ミリ秒]
 */
export function CalcTime(date:number):number[]{
  const millisec = date % 1000;
  let ato = (date - millisec) / 1000;
  const sec = ato % 60;
  ato = (ato - sec) / 60;
  const min = ato % 60;
  const hour = (ato - min) / 60;
  return [hour, min, sec, millisec];
}

class _timerStore {
  private timers = {} as {[key:string]:number};

  start(key:string){
    this.timers[key] = performance.now();
    return new TimerStopper(this, key);
  }

  end(key:string, logger?: (content:string) => void){
    if(this.timers[key]){
      const conteet = "[TimeLogger]Elapsed " + (Math.floor((performance.now() - this.timers[key]) * 100) / 100) + "ms. (" + key + ")";
      if(logger) logger(conteet);
      else log(conteet);
      delete this.timers[key];
    }
  }
}

class TimerStopper {
  constructor(private readonly parent:_timerStore, private readonly key:string){
    //
  }

  end(logger?: (content:string) => void){
    this.parent.end(this.key, logger);
  }
}

export const timer = new _timerStore();
