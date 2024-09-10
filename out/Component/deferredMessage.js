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
exports.DeferredMessage = void 0;
const tslib_1 = require("tslib");
const oceanic_js_1 = require("oceanic.js");
const TypedEmitter_1 = tslib_1.__importDefault(require("../Structure/TypedEmitter"));
const Util_1 = require("../Util");
const decorators_1 = require("../Util/decorators");
/**
 * 遅延したメッセージを表します。
 * 遅延したメッセージは、メッセージの送信がリクエストされてから、指定された時間経過したのちに、
 * 送信されますが、指定された時間経過前に別のメッセージの送信がリクエストされた場合、
 * 当初のリクエストはキャンセルされ、新しいリクエストが即時に送信されます。
 * このクラスは、二回以上送信を遅延させることはできません。
 */
let DeferredMessage = (() => {
    var _a;
    let _classSuper = TypedEmitter_1.default;
    let _instanceExtraInitializers = [];
    let _reply_decorators;
    let _onError_decorators;
    return _a = class DeferredMessage extends _classSuper {
            constructor() {
                super();
                this.replyTo = tslib_1.__runInitializers(this, _instanceExtraInitializers);
                this.message = null;
                this.messageTimeout = null;
                this.messageSending = false;
                this.messageSent = false;
                this._canceled = false;
                this.edit = this.update.bind(this);
            }
            /**
             * 新しい遅延メッセージを作成します。
             * @param replyTo 遅延メッセージの作成方法を指定します。
             * @param timeout 遅延メッセージのタイムアウトを指定します。
             * @param options 遅延メッセージの内容を指定します。
             * @returns 遅延メッセージの状態を表すオブジェクト。
             */
            static create(replyTo, timeout, options) {
                const deferred = new this();
                deferred.replyTo = replyTo;
                deferred.messageTimeout = setTimeout(async () => {
                    deferred.messageSending = true;
                    deferred.emit("preTimeout");
                    deferred.message = await deferred.reply(options).catch(deferred.onError);
                    deferred.emit("timeout", deferred.message);
                    deferred.messageSending = false;
                    deferred.messageSent = true;
                }, timeout).unref();
                return deferred;
            }
            get canceled() {
                return this._canceled;
            }
            set canceled(value) {
                this._canceled = value;
            }
            get channel() {
                return this.replyTo instanceof oceanic_js_1.Channel ? this.replyTo : this.replyTo.channel;
            }
            async reply(options) {
                const res = "reply" in this.replyTo
                    ? await this.replyTo.reply(options)
                    : await this.replyTo.createMessage(options);
                return res;
            }
            onError(reason) {
                this.emit("error", reason);
                return null;
            }
            /**
             * 遅延メッセージを更新します。
             * すでに遅延メッセージが送信されている場合、当該メッセージを更新します。
             * まだ遅延メッセージが送信されていない場合、当初の遅延メッセージの送信はキャンセルされ、指定された内容で即座にメッセージが送信されます。
             * @param options 更新後のメッセージの内容を指定します。
             * @returns 更新後のメッセージオブジェクト
             */
            async update(options) {
                if (!this.messageSending && !this.messageSent) {
                    this.emit("debug", "Canceling the deferred message.");
                    clearTimeout(this.messageTimeout);
                }
                if (this.messageSending) {
                    this.emit("debug", "The deferred message is being sent. Waiting for the message to be sent.");
                    await (0, Util_1.waitForEnteringState)(() => !this.messageSending, 10e3, { rejectOnTimeout: false });
                }
                if (this.message) {
                    this.emit("debug", "Editing the message that has been alrady sent.");
                    return this.message.edit(options);
                }
                else {
                    this.emit("debug", "Sending the message immediately since the deferred message has been canceled.");
                    return this.message = await this.reply(options);
                }
            }
            /**
             * 遅延メッセージの送信をキャンセルします。
             * @param throwIfScheduleAlreadyDone すでに送信されている場合に例外をスローするかどうかを指定します。
             * @returns 遅延メッセージの送信のキャンセルに成功すれば `true`、それ以外の場合は `false` を返します。
             */
            cancelSchedule(throwIfScheduleAlreadyDone) {
                if (this.canceled)
                    return false;
                if (this.messageSent) {
                    if (throwIfScheduleAlreadyDone) {
                        throw new Error("This schedule has already been done.");
                    }
                    return false;
                }
                this.canceled = true;
                this.emit("debug", "Canceling the deferred message.");
                clearTimeout(this.messageTimeout);
                return true;
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _reply_decorators = [decorators_1.bindThis];
            _onError_decorators = [decorators_1.bindThis];
            tslib_1.__esDecorate(_a, null, _reply_decorators, { kind: "method", name: "reply", static: false, private: false, access: { has: obj => "reply" in obj, get: obj => obj.reply }, metadata: _metadata }, null, _instanceExtraInitializers);
            tslib_1.__esDecorate(_a, null, _onError_decorators, { kind: "method", name: "onError", static: false, private: false, access: { has: obj => "onError" in obj, get: obj => obj.onError }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.DeferredMessage = DeferredMessage;
//# sourceMappingURL=deferredMessage.js.map