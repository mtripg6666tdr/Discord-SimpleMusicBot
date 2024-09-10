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
exports.MusicBotBase = void 0;
const tslib_1 = require("tslib");
const child_process_1 = require("child_process");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const httpBased_1 = require("./Component/backupper/httpBased");
const mongodb_1 = require("./Component/backupper/mongodb");
const replit_1 = require("./Component/backupper/replit");
const InteractionCollectorManager_1 = require("./Component/collectors/InteractionCollectorManager");
const rateLimitController_1 = require("./Component/rateLimitController");
const sourceCache_1 = require("./Component/sourceCache");
const Structure_1 = require("./Structure");
const Structure_2 = require("./Structure");
const GuildDataContainerWithBgm_1 = require("./Structure/GuildDataContainerWithBgm");
const Util = tslib_1.__importStar(require("./Util"));
const config_1 = require("./config");
/**
 * 音楽ボットの本体のうち、カスタムデータ構造を実装します
 */
class MusicBotBase extends Structure_2.LogEmitter {
    /**
     * クライアント
     */
    get client() {
        return this._client;
    }
    /**
     * インタラクションコレクター
     */
    get collectors() {
        return this._interactionCollectorManager;
    }
    /**
     * キャッシュマネージャー
     */
    get cache() {
        return this._cacheManger;
    }
    /**
     * バックアップ管理クラス
     */
    get backupper() {
        return this._backupper;
    }
    /**
     * バージョン情報
     * (リポジトリの最終コミットのハッシュ値)
     */
    get version() {
        return this._versionInfo;
    }
    /**
     * 初期化された時刻
     */
    get instantiatedTime() {
        return this._instantiatedTime;
    }
    get databaseCount() {
        return this.guildData.size;
    }
    get connectingGuildCount() {
        return [...this.guildData.values()].filter(guild => guild.player.isConnecting).length;
    }
    get playingGuildCount() {
        return [...this.guildData.values()].filter(guild => guild.player.isPlaying).length;
    }
    get pausedGuildCount() {
        return [...this.guildData.values()].filter(guild => guild.player.isPaused).length;
    }
    get totalTransformingCost() {
        return [...this.guildData.values()]
            .map(d => d.player.cost)
            .reduce((prev, current) => prev + current, 0);
    }
    get rateLimitController() {
        return this._rateLimitController;
    }
    constructor(maintenance = false) {
        super("Main");
        this.maintenance = maintenance;
        this._instantiatedTime = null;
        this._rateLimitController = new rateLimitController_1.RateLimitController();
        this.guildData = new Map();
        this._interactionCollectorManager = new InteractionCollectorManager_1.InteractionCollectorManager();
        this._backupper = null;
        this.maintenanceTickCount = 0;
        this._instantiatedTime = new Date();
        this.logger.info("bot is instantiated");
        if (maintenance) {
            this.logger.info("bot is now maintainance mode");
        }
        const versionObtainStrategies = [
            () => {
                if (fs_1.default.existsSync(path_1.default.join(__dirname, "../DOCKER_BUILD_IMAGE"))) {
                    return require("../package.json").version;
                }
            },
            () => {
                return (0, child_process_1.execSync)("git tag --points-at HEAD")
                    .toString()
                    .trim();
            },
            () => {
                return (0, child_process_1.execSync)("git log -n 1 --pretty=format:%h")
                    .toString()
                    .trim();
            },
        ];
        for (let i = 0; i < versionObtainStrategies.length; i++) {
            try {
                this._versionInfo = versionObtainStrategies[i]();
            }
            catch { /* empty */ }
            if (this._versionInfo)
                break;
        }
        if (!this._versionInfo) {
            this._versionInfo = "Could not get version";
        }
        this.logger.info(`Version: ${this._versionInfo}`);
        this.initializeBackupper();
        const config = (0, config_1.getConfig)();
        this._cacheManger = new sourceCache_1.SourceCache(this, config.cacheLevel === "persistent");
    }
    /**
     * バックアップ用のコンポーネントを、環境設定から初期化します。
     */
    initializeBackupper() {
        if (mongodb_1.MongoBackupper.backuppable) {
            this._backupper = new mongodb_1.MongoBackupper(this, () => this.guildData);
        }
        else if (replit_1.ReplitBackupper.backuppable) {
            this._backupper = new replit_1.ReplitBackupper(this, () => this.guildData);
        }
        else if (httpBased_1.HttpBackupper.backuppable) {
            this._backupper = new httpBased_1.HttpBackupper(this, () => this.guildData);
        }
    }
    /**
     * ボットのデータ整理等のメンテナンスをするためのメインループ。約一分間隔で呼ばれます。
     */
    maintenanceTick() {
        this.maintenanceTickCount++;
        this.logger.debug(`[Tick] #${this.maintenanceTickCount}`);
        this.emit("tick", this.maintenanceTickCount);
        // 4分ごとに主要情報を出力
        if (this.maintenanceTickCount % 4 === 1)
            this.logGeneralInfo();
    }
    /**
     *  定期ログを実行します
     */
    logGeneralInfo() {
        const guildDataArray = [...this.guildData.values()];
        const memory = Util.system.getMemoryInfo();
        this.logger.info(`[Tick] (Client) Participating: ${this._client.guilds.size}, Registered: ${this.guildData.size} Connecting: ${guildDataArray.filter(d => d.player.isConnecting).length} Paused: ${guildDataArray.filter(d => d.player.isPaused).length}`);
        this.logger.info(`[Tick] (System) Free:${Math.floor(memory.free)}MB; Total:${Math.floor(memory.total)}MB; Usage:${memory.usage}%`);
        const nMem = process.memoryUsage();
        const rss = Util.system.getMBytes(nMem.rss);
        const ext = Util.system.getMBytes(nMem.external);
        this.logger.info(`[Tick] (System) Memory RSS: ${rss}MB, Heap total: ${Util.system.getMBytes(nMem.heapTotal)}MB, Total: ${Util.getPercentage(rss + ext, memory.total)}%`);
    }
    /**
     * 必要に応じてサーバーデータを初期化します
     */
    upsertData(guildid, boundChannelId) {
        const prev = this.guildData.get(guildid);
        if (!prev) {
            const config = (0, config_1.getConfig)();
            const server = config.bgm[guildid]
                ? new GuildDataContainerWithBgm_1.GuildDataContainerWithBgm(guildid, boundChannelId, this, config.bgm[guildid])
                : new Structure_1.GuildDataContainer(guildid, boundChannelId, this);
            this.guildData.set(guildid, server);
            this.emit("guildDataAdded", server);
            return server;
        }
        else {
            return prev;
        }
    }
    initDataWithBgm(guildid, boundChannelId, bgmConfig) {
        if (this.guildData.has(guildid))
            throw new Error("guild data was already set");
        const server = new GuildDataContainerWithBgm_1.GuildDataContainerWithBgm(guildid, boundChannelId, this, bgmConfig);
        this.guildData.set(guildid, server);
        this.emit("guildDataAdded", server);
        return server;
    }
    resetData(guildId) {
        this.guildData.delete(guildId);
        this.emit("guildDataRemoved", guildId);
    }
    getData(guildId) {
        return this.guildData.get(guildId);
    }
}
exports.MusicBotBase = MusicBotBase;
//# sourceMappingURL=botBase.js.map