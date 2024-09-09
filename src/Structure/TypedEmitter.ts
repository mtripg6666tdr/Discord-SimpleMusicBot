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

/* eslint-disable @typescript-eslint/method-signature-style */
import { EventEmitter } from "stream";

export type EventDictionary = Record<string|symbol, any>;

interface TypedEventEmitter<T extends EventDictionary> extends EventEmitter {
  addListener<U extends keyof T>(event: U, listener: (...args: T[U]) => void): this;
  emit<U extends keyof T>(event: U, ...args: T[U]): boolean;
  listenerCount(event: keyof T): number;
  listeners<U extends keyof T>(event: U): ((...args: T[U]) => void)[];
  off<U extends keyof T>(event: U, listener: (...args: T[U]) => void): this;
  on<U extends keyof T>(event: U, listener: (...argrs: T[U]) => void): this;
  once<U extends keyof T>(event: U, listener: (...args: T[U]) => void): this;
  prependListener<U extends keyof T>(event: U, listener: (...args: T[U]) => void): this;
  prependOnceListener<U extends keyof T>(event: U, listener: (...args: T[U]) => void): this;
  removeAllListeners(event?: keyof T): this;
  removeListener<U extends keyof T>(event: U, listener: (...args: T[U]) => void): this;
  rawListeners<U extends keyof T>(event: U): ((...args: T[U]) => void)[];
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class TypedEventEmitter<T extends EventDictionary> extends EventEmitter {
  eitherOnce(events: (keyof T)[], listener: () => void) {
    const handler = () => {
      events.forEach(event => this.off(event, handler));
      listener();
    };
    events.forEach(event => this.once(event, handler));
  }

  eitherOn(events: (keyof T)[], listener: () => void) {
    events.forEach(event => this.on(event, listener));
  }

  eitherOff(events: (keyof T)[], listener: () => void) {
    events.forEach(event => this.off(event, listener));
  }
}

export default TypedEventEmitter;

/* eslint-enable @typescript-eslint/method-signature-style */
