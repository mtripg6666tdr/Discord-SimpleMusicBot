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
exports.BinaryManager = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const async_lock_1 = require("@mtripg6666tdr/async-lock");
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const p_event_1 = tslib_1.__importDefault(require("p-event"));
const Structure_1 = require("../Structure");
const Util_1 = require("../Util");
const ffmpegStatic = (0, Util_1.requireIfAny)("ffmpeg-static");
// eslint-disable-next-line @typescript-eslint/ban-types
class BinaryManager extends Structure_1.LogEmitter {
    get binaryPath() {
        return path_1.default.join(this.baseUrl, "./", this.options.localBinaryName + (process.platform === "win32" ? ".exe" : ""));
    }
    get isStaleInfo() {
        return Date.now() - this.lastChecked >= this.checkUpdateTimeout;
    }
    constructor(options) {
        super(`BinaryManager(${options.localBinaryName})`);
        this.options = options;
        this.checkUpdateTimeout = this.options.checkUpdateTimeout || 1000 * 60 /* 1 min */ * 60 /* 1 hour */ * 3 /* 3 hour */;
        this.baseUrl = path_1.default.join(__dirname, global.BUNDLED ? "../bin" : "../../bin");
        this.lastChecked = 0;
        this.releaseInfo = null;
        this.getReleaseInfoLocker = new async_lock_1.LockObj();
        if (!fs_1.default.existsSync(this.baseUrl)) {
            try {
                fs_1.default.mkdirSync(this.baseUrl);
            }
            catch (e) {
                this.logger.warn(e);
                this.logger.info("Fallbacking to the root directory");
                this.baseUrl = path_1.default.join(__dirname, global.BUNDLED ? "../" : "../../");
            }
        }
        if (options.checkImmediately) {
            const latest = this.checkIsLatestVersion();
            if (!latest) {
                this.downloadBinary().catch(this.logger.error);
            }
        }
    }
    async getReleaseInfo() {
        return (0, async_lock_1.lock)(this.getReleaseInfoLocker, async () => {
            if (this.releaseInfo && !this.isStaleInfo) {
                this.logger.info("Skipping the binary info fetching due to valid info cache found");
                return this.releaseInfo;
            }
            const { body } = await candyget_1.default.json(`https://api.github.com/repos/${this.options.binaryRepo}/releases/latest`, {
                headers: {
                    "Accept": "application/vnd.github.v3+json",
                    "User-Agent": "mtripg6666tdr/Discord-SimpleMusicBot",
                },
                validator: (res) => true,
            });
            return this.releaseInfo = body;
        });
    }
    async checkIsLatestVersion() {
        this.lastChecked = Date.now();
        if (!fs_1.default.existsSync(this.binaryPath)) {
            return false;
        }
        else {
            this.logger.info("Checking the latest version");
            const [latestVersion, currentVersion] = await Promise.all([
                this.getReleaseInfo().then(info => info.tag_name),
                this.exec(this.options.checkVersionArgs || ["--version"]).then(output => output.trim()),
            ]);
            const isLatest = latestVersion === currentVersion;
            this.logger.info(isLatest ? "The binary is latest" : "The binary is stale");
            return isLatest;
        }
    }
    async downloadBinary() {
        if (!this.releaseInfo) {
            await this.getReleaseInfo();
        }
        const defaultSelector = (asset, filename) => asset.name === `${filename}${process.platform === "win32" ? ".exe" : ""}`;
        const { binaryName } = this.options;
        const binaryUrl = this.releaseInfo.assets.find(typeof binaryName === "function"
            ? asset => binaryName(asset, filename => defaultSelector(asset, filename))
            : asset => defaultSelector(asset, binaryName))?.browser_download_url;
        if (!binaryUrl) {
            throw new Error("No binary url detected");
        }
        else {
            this.logger.info("Start downloading the binary");
            const result = await candyget_1.default.stream(binaryUrl, {
                headers: {
                    "Accept": "*/*",
                    "User-Agent": "mtripg6666tdr/Discord-SimpleMusicBot",
                },
            });
            const fileStream = result.body.pipe(fs_1.default.createWriteStream(this.binaryPath, {
                mode: 0o777,
            }));
            await Promise.all([
                (0, p_event_1.default)(result.body, "close"),
                (0, p_event_1.default)(fileStream, "close"),
            ]);
            this.lastChecked = Date.now();
            this.logger.info("Finish downloading the binary");
        }
    }
    async exec(args, signal) {
        if (!fs_1.default.existsSync(this.binaryPath) || this.isStaleInfo) {
            const latest = await this.checkIsLatestVersion();
            if (!latest) {
                await this.downloadBinary();
            }
        }
        return new Promise((resolve, reject) => {
            try {
                this.logger.info(`Passing arguments: ${args.join(" ")}`);
                const process = (0, child_process_1.spawn)(this.binaryPath, args, {
                    stdio: ["ignore", "pipe", "pipe"],
                    shell: false,
                    windowsHide: true,
                });
                let bufs = [];
                let ended = false;
                const onEnd = () => {
                    if (ended)
                        return;
                    ended = true;
                    resolve(Buffer.concat(bufs).toString()
                        .trim());
                    if (process.connected) {
                        process.kill("SIGTERM");
                    }
                };
                process.stdout.on("data", (chunk) => bufs.push(chunk));
                process.stdout.on("end", onEnd);
                process.on("exit", onEnd);
                process.stdout.on("error", err => {
                    bufs = null;
                    reject(err);
                });
                process.stderr.on("data", (chunk) => this.logger.info(`[Child] ${chunk.toString()}`));
                signal?.addEventListener("abort", () => {
                    reject("Aborted");
                    process.kill("SIGKILL");
                });
            }
            catch (e) {
                reject(e);
            }
        });
    }
    async execStream(args) {
        if (!fs_1.default.existsSync(this.binaryPath) || this.isStaleInfo) {
            const latest = await this.checkIsLatestVersion();
            if (!latest) {
                await this.downloadBinary();
            }
        }
        const stream = (0, Util_1.createPassThrough)();
        setImmediate(() => {
            this.logger.info(`Passing arguments: ${args.join(" ")}`);
            const childProcess = (0, child_process_1.spawn)(this.binaryPath, args, {
                stdio: ["ignore", "pipe", "pipe"],
                shell: false,
                windowsHide: true,
                env: {
                    ...process.env,
                    "TOKEN": "",
                    "DB_TOKEN": "",
                    "CSE_KEY": "",
                    "PATH": ffmpegStatic
                        ? `${process.env.PATH}${process.platform === "win32" ? ";" : ":"}${path_1.default.join(ffmpegStatic, "..")}`
                        : process.env.PATH,
                },
            });
            let ended = false;
            const onEnd = () => {
                if (ended)
                    return;
                ended = true;
                if (childProcess.connected) {
                    childProcess.kill("SIGKILL");
                }
            };
            childProcess.stdout.pipe(stream);
            childProcess.on("exit", onEnd);
            childProcess.stdout.on("error", err => {
                stream.destroy(err);
            });
            childProcess.stderr.on("data", (chunk) => this.logger.info(`[Child] ${chunk.toString()}`));
            stream.on("close", () => {
                if (childProcess.connected) {
                    childProcess.kill("SIGKILL");
                }
            });
        });
        return stream;
    }
}
exports.BinaryManager = BinaryManager;
//# sourceMappingURL=binaryManager.js.map