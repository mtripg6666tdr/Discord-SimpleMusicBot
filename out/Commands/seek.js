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
const time_1 = require("../Util/time");
let Seek = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class Seek extends _classSuper {
            constructor() {
                super({
                    alias: ["seek"],
                    unlist: false,
                    category: "player",
                    args: [{
                            type: "string",
                            name: "keyword",
                            required: true,
                        }],
                    requiredPermissionsOr: ["admin", "dj", "onlyListener"],
                    shouldDefer: false,
                    examples: true,
                    usage: true,
                });
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                const { t, server } = context;
                // そもそも再生状態ではない場合
                if (!server.player.isPlaying || server.player.preparing) {
                    await message.reply(t("notPlaying")).catch(this.logger.error);
                    return;
                }
                else if (server.player.currentAudioInfo.lengthSeconds === 0 || !server.player.currentAudioInfo.isSeekable) {
                    await message.reply(`:warning:${t("commands:seek.unseekable")}`).catch(this.logger.error);
                    return;
                }
                // 引数から時間を算出
                const time = (0, time_1.colonSplittedTimeToSeconds)(context.rawArgs);
                if (time > server.player.currentAudioInfo.lengthSeconds || isNaN(time)) {
                    await message.reply(`:warning:${t("commands:seek.invalidTime")}`).catch(this.logger.error);
                    return;
                }
                try {
                    const response = await message.reply(`:rocket:${t("commands:seek.seeking")}...`);
                    await server.player.stop({ wait: true });
                    await server.player.play({ time });
                    await response.edit(`:white_check_mark:${t("commands:seek.success")}`).catch(this.logger.error);
                }
                catch (e) {
                    this.logger.error(e);
                    await message.channel.createMessage({
                        content: `:astonished:${t("commands:seek.failed")}`,
                    }).catch(this.logger.error);
                }
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
exports.default = Seek;
//# sourceMappingURL=seek.js.map