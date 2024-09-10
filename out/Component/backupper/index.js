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
exports.IntervalBackupper = exports.Backupper = void 0;
const util_1 = require("util");
const Structure_1 = require("../../Structure");
// eslint-disable-next-line @typescript-eslint/ban-types
class Backupper extends Structure_1.LogEmitter {
    /**
     * 初期化時に与えられたアクセサを使って、サーバーのデータを返します。
     */
    get data() {
        return this.getData();
    }
    constructor(bot, getData) {
        super("Backup");
        this.bot = bot;
        this.getData = getData;
    }
}
exports.Backupper = Backupper;
class IntervalBackupper extends Backupper {
    constructor(bot, getData, name) {
        super(bot, getData);
        this.queueModifiedGuild = new Set();
        this.previousStatusCache = new Map();
        this.logger.info(`Initializing ${name} Database backup server adapter...`);
        // ボットの準備完了直前に実行する
        this.bot.once("beforeReady", () => {
            // コンテナにイベントハンドラを設定する関数
            const setContainerEvent = (container) => {
                container.queue.eitherOn(["change", "changeWithoutCurrent"], () => this.queueModifiedGuild.add(container.getGuildId()));
            };
            // すでに登録されているコンテナにイベントハンドラを登録する
            this.data.forEach(setContainerEvent);
            // これから登録されるコンテナにイベントハンドラを登録する
            this.bot.on("guildDataAdded", setContainerEvent);
            // バックアップのタイマーをセット(二分に一回)
            this.bot.on("tick", (count) => count % 2 === 0 && this.backup());
            this.logger.info("Hook was set up successfully");
        });
    }
    async backup() {
        await this.backupStatus();
        await this.backupQueue();
    }
    updateStatusCache(guildId, status) {
        this.previousStatusCache.set(guildId, JSON.stringify(status));
    }
    getQueueModifiedGuildIds() {
        return [...this.queueModifiedGuild.keys()];
    }
    unmarkQueueModifiedGuild(guildId) {
        this.queueModifiedGuild.delete(guildId);
    }
    unmarkAllQueueModifiedGuild() {
        this.queueModifiedGuild.clear();
    }
    getStatusModifiedGuildIds() {
        return [...this.data.keys()]
            .filter(id => {
            if (!this.previousStatusCache.has(id)) {
                return true;
            }
            else {
                return !(0, util_1.isDeepStrictEqual)(this.data.get(id).exportStatus(), JSON.parse(this.previousStatusCache.get(id)));
            }
        });
    }
}
exports.IntervalBackupper = IntervalBackupper;
//# sourceMappingURL=index.js.map