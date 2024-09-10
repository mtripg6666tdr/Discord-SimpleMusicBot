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
let BgmBd = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class BgmBd extends _classSuper {
            constructor() {
                super({
                    name: "BGMBD",
                    alias: ["bgmbd"],
                    unlist: true,
                    shouldDefer: false,
                    disabled: !process.env.BD_ENABLE,
                });
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                await context.server.joinVoiceChannel(message, { replyOnFail: true });
                const bgmPlaylistUrl = context.rawArgs.length === 0
                    ? "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTExmZmhjQXBzbzl4UFhLUG5YbEZ3czlxWUNkMDltTFA0"
                    : "aHR0cHM6Ly93d3cueW91dHViZS5jb20vcGxheWxpc3Q/bGlzdD1QTExmZmhjQXBzbzl4WnpYZ0RFdEdsQk5wNUtYZjNPY1Zx";
                await context.server.playFromUrl(message, Buffer.from(bgmPlaylistUrl, "base64").toString(), {});
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
exports.default = BgmBd;
//# sourceMappingURL=bdmbd.js.map