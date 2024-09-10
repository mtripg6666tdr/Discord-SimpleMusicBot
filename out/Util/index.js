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
exports.time = exports.system = exports.discordUtil = exports.color = void 0;
exports.stringifyObject = stringifyObject;
exports.filterContent = filterContent;
exports.createPassThrough = createPassThrough;
exports.getPercentage = getPercentage;
exports.getResourceTypeFromUrl = getResourceTypeFromUrl;
exports.retrieveHttpStatusCode = retrieveHttpStatusCode;
exports.requestHead = requestHead;
exports.downloadAsReadable = downloadAsReadable;
exports.retrieveRemoteAudioInfo = retrieveRemoteAudioInfo;
exports.normalizeText = normalizeText;
exports.waitForEnteringState = waitForEnteringState;
exports.createDebounceFunctionsFactroy = createDebounceFunctionsFactroy;
exports.createFragmentalDownloadStream = createFragmentalDownloadStream;
exports.requireIfAny = requireIfAny;
exports.assertIs = assertIs;
exports.assertIsNotNull = assertIsNotNull;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const http_1 = require("http");
const https_1 = require("https");
const stream_1 = require("stream");
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const miniget_1 = tslib_1.__importDefault(require("miniget"));
const throttle_debounce_1 = require("throttle-debounce");
const stream_2 = require("../Util/stream");
const definition_1 = require("../definition");
const logger_1 = require("../logger");
exports.color = tslib_1.__importStar(require("./color"));
exports.discordUtil = tslib_1.__importStar(require("./discord"));
exports.system = tslib_1.__importStar(require("./system"));
exports.time = tslib_1.__importStar(require("./time"));
/**
 * オブジェクトを可能な限り文字列化します
 * @param obj 対象のオブジェクト
 * @returns 文字列。JSON、またはその他の文字列、および空の文字列の場合があります
 */
function stringifyObject(obj) {
    if (!obj) {
        return "null";
    }
    else if (typeof obj === "string") {
        return obj;
    }
    else if (obj instanceof Error) {
        return `${obj.name}: ${obj.message}\n${obj.stack || "no stacks"}`;
    }
    else if (obj["message"]) {
        return obj.message;
    }
    else {
        try {
            return JSON.stringify(obj);
        }
        catch {
            return Object.prototype.toString.call(obj);
        }
    }
}
/**
 * 与えられた文字列に、ファイルパスが含まれている場合、それを隠します。
 * @param original 元の文字列
 * @returns フィルター後の文字列
 */
function filterContent(original) {
    const cwd = process.cwd();
    return original
        .replaceAll(cwd, "***")
        .replace(/https?:\/\/[\w!?/+\-_~;.,*&@#$%()'[\]]+/g, "http:***")
        .replace(/\\/g, "/")
        .replace(/\*/g, "\\*");
}
/**
 * 空のPassThroughを生成します
 * @returns PassThrough
 */
function createPassThrough(opts = {}) {
    const logger = (0, logger_1.getLogger)("PassThrough");
    const id = Date.now();
    logger.debug(`initialized (id: ${id})`);
    const stream = new stream_1.PassThrough(Object.assign({
        highWaterMark: 1024 * 256,
        allowHalfOpen: false,
        emitClose: true,
        autoDestroy: true,
    }, opts));
    stream._destroy = (er, callback) => {
        // for debug purpose
        logger.debug(`destroyed (id: ${id})`);
        stream.destroyed = true;
        callback(er);
    };
    return stream;
}
/**
 * パーセンテージを計算します
 * @param part 計算対象の量
 * @param total 合計量
 * @returns 計算後のパーセンテージ
 */
function getPercentage(part, total) {
    return Math.round(part / total * 100 * 100) / 100;
}
const audioExtensions = [
    ".mp3",
    ".wav",
    ".wma",
    ".ogg",
    ".m4a",
    ".webm",
    ".flac",
];
const videoExtensions = [
    ".mov",
    ".mp4",
    ".webm",
];
function getResourceTypeFromUrl(url, { checkResponse = false } = {}) {
    // check if the url variable is valid string object.
    if (!url || typeof url !== "string") {
        return "none";
    }
    const urlObject = new URL(url);
    // check if the url has a valid protocol and if its pathname ends with a valid extension.
    const urlIsHttp = urlObject.protocol === "http:" || urlObject.protocol === "https:";
    if (!urlIsHttp) {
        return "none";
    }
    const typeInferredFromUrl = videoExtensions.some(ext => urlObject.pathname.endsWith(ext))
        ? "video"
        : audioExtensions.some(ext => urlObject.pathname.endsWith(ext))
            ? "audio"
            : "none";
    if (!checkResponse || typeInferredFromUrl === "none") {
        return typeInferredFromUrl;
    }
    return requestHead(url).then(({ headers }) => headers["content-type"]?.startsWith(`${typeInferredFromUrl}/`) ? typeInferredFromUrl : "none");
}
/**
 * 指定されたURLにHEADリクエストをしてステータスコードを取得します
 * @param url URL
 * @param headers 追加のカスタムリクエストヘッダ
 * @returns ステータスコード
 */
function retrieveHttpStatusCode(url, headers) {
    return requestHead(url, headers).then(d => d.statusCode);
}
/**
 * 指定されたURLにHEADリクエストを行います。
 * @param url URL
 * @param headers 追加のカスタムリクエストヘッダ
 * @returns レスポンス
 */
function requestHead(url, headers = {}) {
    return (0, candyget_1.default)("HEAD", url, "string", {
        headers: {
            "User-Agent": definition_1.DefaultUserAgent,
            ...headers,
        },
        maxRedirects: 0,
    });
}
const httpAgent = new http_1.Agent({ keepAlive: false });
const httpsAgent = new https_1.Agent({ keepAlive: false });
/**
 * 指定されたURLからReadable Streamを生成します
 * @param url URL
 * @returns Readableストリーム
 */
function downloadAsReadable(url, options = { headers: { "User-Agent": definition_1.DefaultUserAgent } }) {
    const logger = (0, logger_1.getLogger)("Util");
    return (0, miniget_1.default)(url, {
        maxReconnects: 10,
        maxRetries: 3,
        backoff: { inc: 500, max: 10000 },
        agent: url.startsWith("https:") ? httpsAgent : httpAgent,
        ...options,
    })
        .on("reconnect", () => logger.warn("Miniget is now trying to re-send a request due to failing"));
}
const durationMatcher = /^\s+Duration: (?<length>(\d+:)*\d+(\.\d+)?),/m;
const titleMatcher = /^\s+title\s+:(?<title>.+)$/m;
const artistMatcher = /^\s+artist\s+:(?<artist>.+)$/m;
/**
 * URLからリモートのオーディオリソースの情報を取得します
 * @param url リソースのURL
 * @returns 取得されたリソースの情報
 */
async function retrieveRemoteAudioInfo(url) {
    // FFmpegに食わせて標準出力を取得する
    const ffmpegOut = await retrieveFFmpegStderrFromUrl(url, () => require("ffmpeg-static"))
        .catch(er => {
        (0, logger_1.getLogger)("Util").info(`Failed: ${stringifyObject(er)}`);
        return retrieveFFmpegStderrFromUrl(url, () => "ffmpeg");
    });
    const result = {
        lengthSeconds: null,
        title: null,
        artist: null,
        displayTitle: null,
    };
    if (!ffmpegOut) {
        return result;
    }
    else if (ffmpegOut.includes("HTTP error")) {
        throw new Error("Failed to fetch data due to HTTP error.");
    }
    if (durationMatcher.test(ffmpegOut)) {
        const match = durationMatcher.exec(ffmpegOut);
        result.lengthSeconds = Math.ceil(match.groups.length
            .split(":")
            .map(n => Number(n))
            .reduce((prev, current) => prev * 60 + current)) || null;
    }
    if (titleMatcher.test(ffmpegOut)) {
        const match = titleMatcher.exec(ffmpegOut);
        result.title = match.groups.title?.trim() || null;
    }
    if (artistMatcher.test(ffmpegOut)) {
        const match = artistMatcher.exec(ffmpegOut);
        result.artist = match.groups.artist?.trim() || null;
    }
    // construct displayTitle
    if (result.title) {
        result.displayTitle = result.artist
            ? `${result.artist} - ${result.title}`
            : result.title;
    }
    return result;
}
function retrieveFFmpegStderrFromUrl(url, ffmpegPathGenerator) {
    return new Promise((resolve, reject) => {
        const ffmpegPath = ffmpegPathGenerator();
        let data = "";
        const proc = (0, child_process_1.spawn)(ffmpegPath, [
            "-i", url,
            "-user_agent", definition_1.DefaultUserAgent,
        ], {
            windowsHide: true,
            stdio: ["ignore", "ignore", "pipe"],
        })
            .on("exit", () => {
            if (data.length === 0) {
                reject(new Error("FFmpeg emit nothing."));
            }
            resolve(data);
        });
        proc.stderr.on("data", chunk => data += chunk);
    });
}
const normalizeTemplate = [
    { from: /０/g, to: "0" },
    { from: /１/g, to: "1" },
    { from: /２/g, to: "2" },
    { from: /３/g, to: "3" },
    { from: /４/g, to: "4" },
    { from: /５/g, to: "5" },
    { from: /６/g, to: "6" },
    { from: /７/g, to: "7" },
    { from: /８/g, to: "8" },
    { from: /９/g, to: "9" },
    // eslint-disable-next-line no-irregular-whitespace
    { from: /　/g, to: " " },
    { from: /！/g, to: "!" },
    { from: /？/g, to: "?" },
    { from: /ｂ/g, to: "b" },
    { from: /ｃ/g, to: "c" },
    { from: /ｄ/g, to: "d" },
    { from: /ｆ/g, to: "f" },
    { from: /ｇ/g, to: "g" },
    { from: /ｈ/g, to: "h" },
    { from: /ｊ/g, to: "j" },
    { from: /ｋ/g, to: "k" },
    { from: /ｌ/g, to: "l" },
    { from: /ｍ/g, to: "m" },
    { from: /ｎ/g, to: "n" },
    { from: /ｐ/g, to: "p" },
    { from: /ｑ/g, to: "q" },
    { from: /ｒ/g, to: "r" },
    { from: /ｓ/g, to: "s" },
    { from: /ｔ/g, to: "t" },
    { from: /ｖ/g, to: "v" },
    { from: /ｗ/g, to: "w" },
    { from: /ｘ/g, to: "x" },
    { from: /ｙ/g, to: "y" },
    { from: /ｚ/g, to: "z" },
    { from: /＞/g, to: ">" },
    { from: /＜/g, to: "<" },
];
/**
 * 文字列を正規化します
 */
function normalizeText(rawText) {
    let result = rawText;
    normalizeTemplate.forEach(reg => {
        result = result.replace(reg.from, reg.to);
    });
    return result;
}
/**
 * 与えられた関数がtrueを返すまで待機します。
 * @param predicate 待機完了かどうかを判定する関数
 * @param timeout 待機時間の最大値（タイムアウト時間）。設定しない場合はInfinityとします。
 * @param options 追加の設定
 * @returns
 */
function waitForEnteringState(predicate, timeout = 10 * 1000, options) {
    const { rejectOnTimeout, timeStep } = Object.assign({
        rejectOnTimeout: true,
        timeStep: 50,
    }, options);
    return new Promise((resolve, reject) => {
        let count = 0;
        const startTime = Date.now();
        if (predicate()) {
            resolve(0);
        }
        else if (timeout < 50) {
            reject("timed out");
        }
        const ticker = setInterval(() => {
            count++;
            if (predicate()) {
                clearInterval(ticker);
                resolve(Date.now() - startTime);
            }
            else if (timeout <= timeStep * count) {
                clearInterval(ticker);
                if (rejectOnTimeout) {
                    reject(`target predicate has not return true in time (${timeout}ms) and timed out`);
                }
                else {
                    resolve(Date.now() - startTime);
                }
            }
        }, timeStep).unref();
    });
}
function createDebounceFunctionsFactroy(func, debounceDelay) {
    // eslint-disable-next-line func-call-spacing
    const functionsStore = new Map();
    return (key) => {
        if (functionsStore.has(key)) {
            return functionsStore.get(key);
        }
        else {
            const fn = (0, throttle_debounce_1.debounce)(debounceDelay, () => func(key));
            functionsStore.set(key, fn);
            return fn;
        }
    };
}
function createFragmentalDownloadStream(streamGenerator, { contentLength, chunkSize = 512 * 1024, userAgent = definition_1.SecondaryUserAgent, pulseDownload = false, }) {
    const logger = (0, logger_1.getLogger)("FragmentalDownloader", true);
    logger.addContext("id", Date.now());
    const stream = createPassThrough();
    setImmediate(async () => {
        let current = -1;
        if (contentLength < chunkSize) {
            const originStream = typeof streamGenerator === "string"
                ? downloadAsReadable(streamGenerator, {
                    headers: {
                        "User-Agent": userAgent,
                    },
                })
                : await streamGenerator(0);
            if (pulseDownload) {
                const pulseBuffer = createPassThrough({ highWaterMark: Math.floor(chunkSize * 1.2) });
                originStream
                    .on("request", logger.trace)
                    .on("response", res => res.once("close", () => logger.trace("Response closed")))
                    .on("end", () => logger.trace("Origin stream ended"))
                    .on("error", er => (0, stream_2.destroyStream)(pulseBuffer, er))
                    .pipe(pulseBuffer)
                    .on("error", er => (0, stream_2.destroyStream)(stream, er))
                    .once("close", () => (0, stream_2.destroyStream)(originStream))
                    .pipe(stream)
                    .once("close", () => (0, stream_2.destroyStream)(pulseBuffer));
            }
            else {
                originStream
                    .on("request", logger.trace)
                    .on("response", res => res.once("close", () => logger.trace("Response closed")))
                    .on("end", () => logger.trace("Origin stream ended"))
                    .on("error", er => stream.destroy(er))
                    .pipe(stream);
            }
            logger.info(`Stream was created as a single stream. (buffer: ${chunkSize} / content length: ${contentLength})`);
        }
        else {
            const pipeNextStream = async () => {
                current++;
                let end = chunkSize * (current + 1) - 1;
                if (end >= contentLength) {
                    end = undefined;
                }
                const nextStream = typeof streamGenerator === "string"
                    ? downloadAsReadable(streamGenerator, {
                        headers: {
                            "User-Agent": userAgent,
                            "Range": `bytes=${chunkSize * current}-${end ? end : ""}`,
                        },
                    })
                    : await streamGenerator(chunkSize * current, end);
                logger.info(`Stream #${current + 1} was created`);
                let pulseBuffer = null;
                if (pulseDownload) {
                    pulseBuffer = createPassThrough({ highWaterMark: Math.floor(chunkSize * 1.2) });
                    nextStream
                        .on("request", logger.trace)
                        .on("response", res => res.once("close", () => logger.trace("Response closed")))
                        .on("end", () => logger.trace("Origin stream ended"))
                        .on("error", er => (0, stream_2.destroyStream)(pulseBuffer, er))
                        .pipe(pulseBuffer)
                        .on("error", er => (0, stream_2.destroyStream)(stream, er))
                        .once("close", () => (0, stream_2.destroyStream)(nextStream))
                        .pipe(stream, { end: end === undefined })
                        .once("close", () => (0, stream_2.destroyStream)(pulseBuffer));
                }
                else {
                    nextStream
                        .on("request", logger.trace)
                        .on("response", res => res.once("close", () => logger.trace("Response closed")))
                        .on("end", () => logger.trace("Origin stream ended"))
                        .on("error", er => (0, stream_2.destroyStream)(stream, er))
                        .pipe(stream, { end: end === undefined })
                        .once("close", () => (0, stream_2.destroyStream)(nextStream));
                }
                if (end !== undefined) {
                    (pulseBuffer || nextStream).on("end", () => pipeNextStream());
                }
                else {
                    logger.info(`Last stream (total: ${current + 1})`);
                }
            };
            pipeNextStream().catch(logger.warn);
            logger.info(`Stream was created as partial stream. ${Math.ceil(contentLength / chunkSize)} streams will be created.`);
        }
    });
    return stream;
}
function requireIfAny(id) {
    try {
        return require(id);
    }
    catch (e) {
        const logger = (0, logger_1.getLogger)("Util");
        logger.info(`The module "${id}" couldn't be loaded because of the error: ${stringifyObject(e)}`);
        return null;
    }
}
function assertIs(obj) { }
function assertIsNotNull(obj) { }
//# sourceMappingURL=index.js.map