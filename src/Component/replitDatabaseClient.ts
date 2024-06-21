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

import candyget from "candyget";
import PQueue from "p-queue";

export class ReplitClient {
  protected baseUrl: string;
  protected queue: PQueue;

  constructor(baseUrl: string){
    this.baseUrl = baseUrl;

    if(!this.baseUrl){
      throw new Error("No URL found");
    }

    this.queue = new PQueue({
      concurrency: 3,
      timeout: 10e3,
      throwOnTimeout: true,
      intervalCap: 4,
      interval: 10,
    });
  }

  get(key: string, options: { raw: true }): Promise<string>;
  get<T = any>(key: string, options?: { raw: false }): Promise<T>;
  get(key: string, options?: { raw: boolean }){
    return this.queue.add(async () => {
      const shouldRaw = options?.raw || false;
      const { body } = await candyget(`${this.baseUrl}/${key}`, "string");
      if(!body){
        return null;
      }else if(shouldRaw){
        return body;
      }else{
        return JSON.parse(body);
      }
    });
  }

  set(key: string, value: any){
    return this.queue.add(async () => {
      const textData = JSON.stringify(value);

      const { statusCode } = await candyget.post(this.baseUrl, "empty", {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }, `${encodeURIComponent(key)}=${encodeURIComponent(textData)}`);

      if(statusCode >= 200 && statusCode <= 299){
        return this;
      }else{
        throw new Error(`Status code: ${statusCode}`);
      }
    });
  }

  delete(key: string){
    return this.queue.add(async () => {
      await candyget.delete(`${this.baseUrl}/${key}`, "empty");
      return this;
    });
  }
}
