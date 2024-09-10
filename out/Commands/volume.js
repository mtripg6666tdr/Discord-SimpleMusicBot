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
const tslib_1 = require("tslib");
const _1 = require(".");
let Volume = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class Volume extends _classSuper {
            constructor() {
                super({
                    alias: ["volume", "vol"],
                    unlist: false,
                    category: "voice",
                    args: [{
                            type: "integer",
                            name: "volume",
                            required: false,
                        }],
                    requiredPermissionsOr: ["admin", "sameVc"],
                    shouldDefer: false,
                    examples: true,
                    usage: true,
                });
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                const { t } = context;
                if (context.rawArgs === "") {
                    await message.reply(`:loud_sound:${t("commands:volume.currentVolume", { volume: context.server.player.volume })}`)
                        .catch(this.logger.error);
                    return;
                }
                const newval = Number(context.rawArgs);
                if (isNaN(newval) || newval < 1 || newval > 200) {
                    message.reply(`:bangbang:${t("commands:volume.outOfRange")}`)
                        .catch(this.logger.error);
                    return;
                }
                // 音量変更が即反映されたか？
                const result = context.server.player.setVolume(newval);
                await message.reply(`:loud_sound:${t("commands:volume.changed", { volume: newval })}\r\n`
                    + (context.server.player.isPlaying && !result
                        ? t("commands:volume.appliedFromNext")
                        : ""))
                    .catch(this.logger.error);
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _run_decorators = [(_b = _1.BaseCommand).updateBoundChannel.bind(_b)];
            tslib_1.__esDecorate(_a, null, _run_decorators, { kind: "method", name: "run", static: false, private: false, access: { has: obj => "run" in obj, get: obj => obj.run }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.default = Volume;
//# sourceMappingURL=volume.js.map