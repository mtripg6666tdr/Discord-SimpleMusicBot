/*
 * Copyright 2021-2024 mtripg6666tdr
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
import { RateLimitJudgementResult } from "../types/rateLimitController";

export class RateLimitController {
  protected readonly store = new Map<string, number[]>();
  protected logger = getLogger("RateLimitController");

  /**
   * キーに現在時刻での新しいイベントをレートリミットコントローラーに追加し、レートリミット状態に当たるかどうかを確認します。
   * @param key 新しいイベントの追加先のキー
   * @returns キーにイベントを追加後、レートリミット状態になっていれば true、そうでなければ false
   */
  pushEvent(key: string) {
    if (!this.store.has(key)) {
      this.store.set(key, [Date.now()]);
      return false;
    }

    const { isLimited, timeSinceLastEvent, store } = this.judgeRateLimiting(key);

    if (isLimited) {
      if (timeSinceLastEvent < 2 * 1000) {
        store.push(Date.now());
      }
      this.logger.info(`Key ${key} hit the ratelimit.`);
      return true;
    } else {
      store.push(Date.now());
      return false;
    }
  }

  isLimited(key: string) {
    if (!this.store) {
      return false;
    }

    const { isLimited } = this.judgeRateLimiting(key);

    if (isLimited) {
      this.logger.info(`Key ${key} hit the ratelimit.`);
      return true;
    } else {
      return false;
    }
  }

  private judgeRateLimiting(key: string): RateLimitJudgementResult {
    let cnt10sec = 0;
    const now = Date.now();

    if (!this.store.has(key)) {
      const store = [now];
      this.store.set(key, store);

      return {
        isLimited: false,
        timeSinceLastEvent: null,
        store: store,
      };
    }

    const currentStore = this.store.get(key)!.filter(dt => {
      const sub = now - dt;
      if (sub < 10 * 1000) cnt10sec++;
      return sub < 60 * 1000;
    });
    this.store.set(key, currentStore);

    return {
      isLimited: currentStore.length > 15 || cnt10sec > 5,
      timeSinceLastEvent: currentStore.length > 0 ? now - currentStore.at(-1)! : null,
      store: currentStore,
    } as RateLimitJudgementResult;
  }
}
