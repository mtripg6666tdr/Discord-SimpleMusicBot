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

import TypedEventEmitter from "../Structure/TypedEmitter";
import { getLogger } from "../logger";

const timerLogger = getLogger("Timer");
export function measureTime<This, Args extends any[], Return>(
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
){
  return function replacementMethod(this: This, ...args: Args): Return {
    const start = Date.now();
    let end = false;
    const endLog = () => {
      if(end) return;
      end = true;
      timerLogger.trace(`${this?.constructor.name || ""}#${String(context.name)} elapsed ${Date.now() - start}ms`);
    };
    let result: any = null;
    try{
      result = originalMethod.call(this, ...args);
      if(result instanceof Promise){
        return result.finally(endLog) as any;
      }else{
        endLog();
      }
      return result;
    }
    finally{
      if(typeof result !== "object" || !(result instanceof Promise)){
        endLog();
      }
    }
  };
}

export function bindThis(_originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = context.name;
  if(context.private){
    throw new Error(`Unable to decorate private property:${methodName as string}.`);
  }
  context.addInitializer(function() {
    (this as any)[methodName] = (this as any)[methodName].bind(this);
  });
}

export function emitEventOnMutation<EventKey extends string>(eventName: EventKey){
  return function emitEventOnMutationDecorator<
    This extends TypedEventEmitter<Events>,
    Events extends { [key in EventKey]: [ValueType, ValueType] },
    ValueType
  >(
    originalValue: {
      get: (this: This) => ValueType,
      set: (this: This, value: ValueType) => void,
    },
    _context: ClassAccessorDecoratorContext<This, ValueType>,
  ): {
      get?: (this: This) => ValueType,
      set?: (this: This, value: ValueType) => void,
      init?: (this: This, initialValue: ValueType) => ValueType,
    }{
    return {
      get: originalValue.get,
      set: function set(value: ValueType) {
        const oldValue = originalValue.get.call(this);

        if(oldValue !== value){
          // @ts-expect-error
          this.emit(eventName, value, oldValue);
        }

        return originalValue.set.call(this, value);
      },
    };
  };
}
