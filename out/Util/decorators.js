"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureTime = measureTime;
exports.bindThis = bindThis;
exports.emitEventOnMutation = emitEventOnMutation;
const logger_1 = require("../logger");
const timerLogger = (0, logger_1.getLogger)("Timer");
function measureTime(originalMethod, context) {
    return function replacementMethod(...args) {
        const start = Date.now();
        let end = false;
        const endLog = () => {
            if (end)
                return;
            end = true;
            timerLogger.trace(`${this?.constructor.name || ""}#${String(context.name)} elapsed ${Date.now() - start}ms`);
        };
        let result = null;
        try {
            result = originalMethod.call(this, ...args);
            if (result instanceof Promise) {
                return result.finally(endLog);
            }
            else {
                endLog();
            }
            return result;
        }
        finally {
            if (typeof result !== "object" || !(result instanceof Promise)) {
                endLog();
            }
        }
    };
}
function bindThis(_originalMethod, context) {
    const methodName = context.name;
    if (context.private) {
        throw new Error(`Unable to decorate private property:${methodName}.`);
    }
    context.addInitializer(function () {
        this[methodName] = this[methodName].bind(this);
    });
}
function emitEventOnMutation(eventName) {
    return function emitEventOnMutationDecorator(originalValue, _context) {
        return {
            get: originalValue.get,
            set: function set(value) {
                const oldValue = originalValue.get.call(this);
                if (oldValue !== value) {
                    // @ts-expect-error
                    this.emit(eventName, value, oldValue);
                }
                return originalValue.set.call(this, value);
            },
        };
    };
}
//# sourceMappingURL=decorators.js.map