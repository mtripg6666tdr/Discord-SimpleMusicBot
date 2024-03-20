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

import { getLogger } from "../logger";

export class RateLimitController {
  protected readonly store = new Map<string, number[]>();
  protected logger = getLogger("RateLimitController");

  isRateLimited(key: string){
    if(!this.store.has(key)){
      this.store.set(key, [Date.now()]);
      return false;
    }
    let cnt10sec = 0;
    const currentStore = this.store.get(key)!.filter(dt => {
      const sub = Date.now() - dt;
      if(sub < 10 * 1000) cnt10sec++;
      return sub < 60 * 1000;
    });
    this.store.set(key, currentStore);
    if(currentStore.length > 15 || cnt10sec > 5){
      if(Date.now() - currentStore[currentStore.length - 1] < 2 * 1000){
        currentStore.push(Date.now());
      }
      this.logger.info(`Key ${key} hit the ratelimit.`);
      return true;
    }else{
      currentStore.push(Date.now());
      return false;
    }
  }
}
