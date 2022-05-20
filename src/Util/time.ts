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
    return new timerStopper(this, key);
  }

  end(key:string){
    if(this.timers[key]){
      log("[TimeLogger]Elapsed " + (Math.floor((performance.now() - this.timers[key]) * 100) / 100) + "ms. (" + key + ")");
      delete this.timers[key];
    }
  }
}

class timerStopper {
  constructor(private parent:_timerStore, private key:string){
    //
  }
  end(){
    this.parent.end(this.key);
  }
}

export const timer = new _timerStore();