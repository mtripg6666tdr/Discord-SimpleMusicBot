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
let RmDuplicated = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class RmDuplicated extends _classSuper {
            constructor() {
                super({
                    alias: ["removedupes", "rmdupes", "rmduplicated", "removeduplicates", "drm"],
                    unlist: false,
                    category: "playlist",
                    requiredPermissionsOr: ["admin", "onlyListener", "dj"],
                    shouldDefer: false,
                });
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                const { t } = context;
                // 削除するアイテムのリストを作成
                const q = context.server.queue;
                const indexes = [];
                const itemUrl = [];
                q.forEach((item, i) => {
                    if (itemUrl.includes(item.basicInfo.url)) {
                        indexes.push(i);
                    }
                    else {
                        itemUrl.push(item.basicInfo.url);
                    }
                });
                const dels = Array.from(new Set(indexes
                    .filter(n => !isNaN(n))
                    .sort((a, b) => b - a)));
                // 削除を実行する
                const actualDeleted = [];
                const failed = [];
                let firstItemTitle = null;
                for (let i = 0; i < dels.length; i++) {
                    const item = q.get(dels[i]);
                    q.removeAt(dels[i]);
                    actualDeleted.push(dels[i]);
                    if (actualDeleted.length === 1) {
                        firstItemTitle = item.basicInfo.title;
                    }
                }
                if (actualDeleted.length > 0) {
                    const title = actualDeleted.length === 1 ? firstItemTitle : null;
                    const resultStr = actualDeleted.sort((a, b) => a - b).join(",");
                    const failedStr = failed.sort((a, b) => a - b).join(",");
                    message.reply(`🚮${resultStr.length > 100
                        ? "重複していた"
                        : `${resultStr}番目の`}曲${title ? `(\`${title}\`)` : ""}を削除しました${failed.length > 0
                        ? `\r\n:warning:${failed.length > 100 ? "一部" : `${failedStr}番目`}の曲は権限がないため削除できませんでした。`
                        : ""}`).catch(this.logger.error);
                    message.reply(`🚮${resultStr.length > 100
                        ? t("commands:removedupes.removedMany")
                        : t("commands:removedupes.removedAt", { indexes: resultStr, title: title ? `(\`${title}\`)` : "" })}${failed.length > 100
                        ? `\r\n${t("commands:remove.unableToRemoveMany")}`
                        : failed.length > 0
                            ? `\r\n${t("commands:remove.unableToRemoveAt", { indexes: failedStr })}`
                            : ""}`).catch(this.logger.error);
                }
                else {
                    message.reply(t("commands:removedupes.noSongRemoved")).catch(this.logger.error);
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
exports.default = RmDuplicated;
//# sourceMappingURL=removedupes.js.map