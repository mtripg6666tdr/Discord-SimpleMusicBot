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
exports.Normalizer = void 0;
const tslib_1 = require("tslib");
const stream_1 = require("stream");
const decorators_1 = require("../../Util/decorators");
const logger_1 = require("../../logger");
let Normalizer = (() => {
    var _a;
    let _classSuper = stream_1.Readable;
    let _instanceExtraInitializers = [];
    let __onDestroy_decorators;
    return _a = class Normalizer extends _classSuper {
            constructor(origin, inlineVolume, options = {}) {
                super(Object.assign({
                    highWaterMark: 64 * 4 * 1024 * (inlineVolume ? 5 : 1),
                }, options));
                this.origin = (tslib_1.__runInitializers(this, _instanceExtraInitializers), origin);
                this.inlineVolume = inlineVolume;
                this.logger = (0, logger_1.getLogger)("Normalizer");
                this._destroyed = false;
                this.resumeHighWaterMark = this.readableHighWaterMark * 0.6;
                const now = Date.now();
                setImmediate(() => {
                    if (this.origin) {
                        this.on("data", () => {
                            if (this.readableLength < this.resumeHighWaterMark) {
                                this.resumeOrigin();
                            }
                            else {
                                this.pauseOrigin();
                            }
                        });
                        this.origin.on("data", chunk => {
                            if (!this.push(chunk)) {
                                this.pauseOrigin();
                            }
                        });
                        this.origin.once("data", chunk => {
                            this.logger.debug(`first chunk received; elapsed ${Date.now() - now}ms / ${chunk.length} bytes`);
                        });
                    }
                }).unref();
                this.origin.once("end", () => this.push(null));
                this.origin.on("error", er => this.destroy(er));
                this.once("close", this._onDestroy);
                this.once("end", this._onDestroy);
                this.logger.info("initialized");
            }
            _read() {
                if (this.readableLength < this.readableHighWaterMark) {
                    this.resumeOrigin();
                }
            }
            pauseOrigin() {
                if (this.origin && !this.origin.destroyed && !this.origin.isPaused()) {
                    this.logger.debug(`Origin paused (${this.readableLength}/${this.readableHighWaterMark})`);
                    this.origin.pause();
                }
            }
            resumeOrigin() {
                if (this.origin && !this.origin.destroyed && this.origin.isPaused()) {
                    this.logger.debug(`Origin resumed (${this.readableLength}/${this.readableHighWaterMark})`);
                    this.origin.resume();
                }
            }
            _onDestroy() {
                if (this._destroyed) {
                    return;
                }
                this._destroyed = true;
                this.logger.debug("Destroy hook called");
                this.off("close", this._onDestroy);
                this.off("end", this._onDestroy);
                if (this.origin) {
                    this.logger.info("Attempting to destroy origin");
                    if (!this.origin.destroyed) {
                        this.origin.destroy();
                    }
                    this.origin = null;
                    try {
                        if ("_readableState" in this) {
                            // @ts-expect-error 2339
                            this._readableState.buffer.clear();
                            // @ts-expect-error 2339
                            this._readableState.length = 0;
                        }
                    }
                    catch { /* empty */ }
                }
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __onDestroy_decorators = [decorators_1.bindThis];
            tslib_1.__esDecorate(_a, null, __onDestroy_decorators, { kind: "method", name: "_onDestroy", static: false, private: false, access: { has: obj => "_onDestroy" in obj, get: obj => obj._onDestroy }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.Normalizer = Normalizer;
//# sourceMappingURL=normalizer.js.map