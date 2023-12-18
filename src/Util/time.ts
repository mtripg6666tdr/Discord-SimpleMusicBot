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

import type { i18n } from "i18next";

/**
 * 合計時間(秒)からゼロ補完された分および秒を計算します。
 * @param totalSec 合計時間(秒)
 * @returns [ゼロ補完された分,ゼロ補完された秒]
 */
export function calcMinSec(totalSec: number){
  const sec = totalSec % 60;
  const min = (totalSec - sec) / 60;
  return [
    min.toString().padStart(2, "0"),
    sec.toString().padStart(2, "0"),
  ];
}

/**
 * 合計時間(秒)から時間、ゼロ補完された分および秒を計算します。
 * @param totalSec 合計時間(秒)
 * @returns [時間, ゼロ補完された分, ゼロ補完された秒]
 */
export function calcHourMinSec(totalSec: number): [string, string, string]{
  const sec = totalSec % 60;
  const min = (totalSec - sec) / 60 % 60;
  const hr = ((totalSec - sec) / 60 - min) / 60;
  return [
    hr.toString(),
    min.toString().padStart(2, "0"),
    sec.toString().padStart(2, "0"),
  ];
}

/**
 * [時間, ゼロ補完された分, ゼロ補完された秒]から表示するための時刻表示を作成します。
 * @param param0 
 * @returns 
 */
export function HourMinSecToString([hour, min, sec]: string[], t: i18n["t"]){
  return hour === "NaN" ? t("unknown") : `${hour === "0" ? "" : `${hour}:`}${min}:${sec}`;
}

// Returns hour, min, sec and millisec from total millisec
/**
 * 合計時間(ミリ秒)から時間,分,秒,ミリ秒を計算します。
 * @param date 合計時間(ミリ秒)
 * @returns [時間,分,秒,ミリ秒]
 */
export function calcTime(date: number): number[]{
  const millisec = date % 1000;
  let ato = (date - millisec) / 1000;
  const sec = ato % 60;
  ato = (ato - sec) / 60;
  const min = ato % 60;
  const hour = (ato - min) / 60;
  return [hour, min, sec, millisec];
}
