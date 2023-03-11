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

import type { GuildDataContainer } from "../Structure";

export const EffectsCustomIds = {
  Reload: "reload",
  BassBoost: "bass_boost",
  Reverb: "reverb",
  LoudnessEqualization: "loudness_eq",
};

export function getFFmpegEffectArgs(data: GuildDataContainer){
  const effect = [];
  if(data.effectPrefs.BassBoost){
    effect.push("firequalizer=gain_entry='entry(31,4);entry(62,2.7);entry(125,0.6)'");
  }
  if(data.effectPrefs.Reverb){
    effect.push("aecho=1.0:0.7:20:0.5");
  }
  if(data.effectPrefs.LoudnessEqualization){
    effect.push("loudnorm");
  }

  if(effect.length >= 1){
    return ["-af", effect.join(",")];
  }else{
    return [];
  }
}
