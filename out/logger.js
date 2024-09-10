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
exports.getLogs = void 0;
exports.getLogger = getLogger;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const worker_threads_1 = require("worker_threads");
const log4js_1 = tslib_1.__importDefault(require("log4js"));
const Util_1 = require("./Util");
const config_1 = require("./config");
const { debug, maxLogFiles } = (0, config_1.getConfig)();
const tokens = {
    category: function (logEvent) {
        if (logEvent.context?.id) {
            return `${logEvent.categoryName}/${logEvent.context?.id}`;
        }
        else {
            return logEvent.categoryName;
        }
    },
    level: function (logEvent) {
        switch (logEvent.level.levelStr) {
            case "INFO":
                return "INFO ";
            case "WARN":
                return "WARN ";
            default:
                return logEvent.level.levelStr;
        }
    },
};
const fileLayout = {
    type: "pattern",
    pattern: "%d %x{level} [%x{category}] %m",
    tokens,
};
const stdoutLayout = {
    type: "pattern",
    pattern: "%[%d%] %[%x{level}%] %[[%x{category}]%] %m",
    tokens,
};
const MEMORYSTORE_MAXSIZE = 40;
const memoryStore = [];
const memoryAppender = {
    configure: function () {
        return function (logEvent) {
            const level = logEvent.level.levelStr[0];
            const logContent = `${level}:[${tokens.category(logEvent)}] ${logEvent.data.map(data => typeof data === "string" ? data : (0, Util_1.stringifyObject)(data))}`;
            if (!logContent.includes("(SECRET)")) {
                memoryStore.push(logContent);
            }
            if (memoryStore.length > MEMORYSTORE_MAXSIZE) {
                memoryStore.shift();
            }
            if (process.env.CONSOLE_ENABLE) {
                console[level === "F" || level === "E" ? "error" : level === "W" ? "warn" : "log"](logContent);
            }
        };
    },
};
const getLogs = () => memoryStore;
exports.getLogs = getLogs;
const TRANSFER_PORT = Number(process.env.LOG_TRANSFER_PORT) || 5003;
if (worker_threads_1.isMainThread) {
    if (debug) {
        log4js_1.default.configure({
            appenders: {
                out: {
                    type: "stdout",
                    layout: stdoutLayout,
                },
                file: {
                    type: "file",
                    filename: path_1.default.join(__dirname, `../logs/log-${Date.now()}.log`),
                    backups: 999,
                    layout: fileLayout,
                },
                memory: {
                    type: memoryAppender,
                },
                server: {
                    type: "tcp-server",
                    port: TRANSFER_PORT,
                },
            },
            categories: {
                default: { appenders: ["out", "file", "memory"], level: "trace" },
            },
        });
    }
    else {
        log4js_1.default.configure({
            appenders: {
                out: {
                    type: "stdout",
                    layout: stdoutLayout,
                },
                memory: {
                    type: memoryAppender,
                },
                server: {
                    type: "tcp-server",
                    port: TRANSFER_PORT,
                },
            },
            categories: {
                default: { appenders: ["out", "memory"], level: "info" },
            },
        });
    }
}
else {
    log4js_1.default.configure({
        appenders: {
            network: {
                type: "tcp",
                port: TRANSFER_PORT,
            },
        },
        categories: {
            default: { appenders: ["network"], level: "trace" },
        },
    });
}
const loggerMap = new Map();
function getLogger(tag, createNew = false) {
    if (loggerMap.has(tag) && !createNew) {
        return loggerMap.get(tag);
    }
    else {
        const log4jsLogger = log4js_1.default.getLogger(tag);
        const logger = {
            trace: log4jsLogger.trace.bind(log4jsLogger),
            debug: log4jsLogger.debug.bind(log4jsLogger),
            info: log4jsLogger.info.bind(log4jsLogger),
            warn: log4jsLogger.warn.bind(log4jsLogger),
            error: log4jsLogger.error.bind(log4jsLogger),
            fatal: log4jsLogger.fatal.bind(log4jsLogger),
            addContext: createNew ? log4jsLogger.addContext.bind(log4jsLogger) : undefined,
        };
        if (!createNew) {
            loggerMap.set(tag, logger);
        }
        return logger;
    }
}
//古いログファイルの削除
const logger = getLogger("Logger");
const deleteFiles = fs_1.default.readdirSync(path_1.default.join(__dirname, "../logs/"), { withFileTypes: true })
    .filter(d => d.isFile() && d.name.endsWith(".log"))
    .map(d => d.name)
    .sort()
    .slice(0, -maxLogFiles);
if (deleteFiles.length > 0) {
    logger.debug("Deleting " + deleteFiles.length + " log files.");
    deleteFiles.forEach(name => fs_1.default.unlinkSync(path_1.default.join(__dirname, "../logs", name)));
}
//# sourceMappingURL=logger.js.map