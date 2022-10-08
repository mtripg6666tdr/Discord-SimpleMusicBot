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

export class RateLimitController {
  private store:{[key:string]:number[]} = {};

  hasRateLimited(key:string){
    if(!this.store[key]){
      this.store[key] = [Date.now()];
      return false;
    }
    let cnt10sec = 0;
    this.store[key] = this.store[key].filter(dt => {
      const sub = Date.now() - dt;
      if(sub < 10 * 1000) cnt10sec++;
      return sub < 60 * 1000;
    });
    if(this.store[key].length > 15 || cnt10sec > 5){
      if(Date.now() - this.store[key][this.store[key].length - 1] < 2 * 1000){
        this.store[key].push(Date.now());
      }
      return true;
    }else{
      this.store[key].push(Date.now());
      return false;
    }
  }
}
