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
exports.MusicBot = void 0;
const tslib_1 = require("tslib");
const i18next_1 = tslib_1.__importDefault(require("i18next"));
const discord = tslib_1.__importStar(require("oceanic.js"));
const telemetry_1 = require("./Component/telemetry");
const Util_1 = require("./Util");
const botBase_1 = require("./botBase");
const config_1 = require("./config");
const eventHandlers = tslib_1.__importStar(require("./events"));
const config = (0, config_1.getConfig)();
/**
 * 音楽ボットの本体
 */
class MusicBot extends botBase_1.MusicBotBase {
    get readyFinished() {
        return this._isReadyFinished;
    }
    get telemetry() {
        return this._telemetry;
    }
    get mentionText() {
        return this._mentionText;
    }
    constructor(token, maintenance = false) {
        super(maintenance);
        // eslint-disable-next-line @typescript-eslint/prefer-readonly
        this._isReadyFinished = false;
        this._telemetry = null;
        // ready.ts で値を代入しているため
        // eslint-disable-next-line @typescript-eslint/prefer-readonly
        this._mentionText = "";
        this._client = new discord.Client({
            auth: `Bot ${token}`,
            gateway: {
                intents: config.noMessageContent ? [
                    "GUILDS",
                    "GUILD_MESSAGES",
                    "GUILD_VOICE_STATES",
                ] : [
                    "GUILDS",
                    "GUILD_MESSAGES",
                    "GUILD_VOICE_STATES",
                    "MESSAGE_CONTENT",
                ],
                compress: (0, Util_1.requireIfAny)("zlib-sync") || (0, Util_1.requireIfAny)("pako") ? "zlib-stream" : false,
            },
        });
        this._telemetry = process.env.DISABLE_TELEMETRY ? null : new telemetry_1.Telemetry(this);
        this.client.once("ready", eventHandlers.onReady.bind(this));
        this.once("ready", () => {
            this.client
                .on("ready", eventHandlers.onReady.bind(this))
                .on("messageCreate", eventHandlers.onMessageCreate.bind(this))
                .on("interactionCreate", eventHandlers.onInteractionCreate.bind(this))
                .on("voiceChannelJoin", eventHandlers.onVoiceChannelJoin.bind(this))
                .on("voiceChannelLeave", eventHandlers.onVoiceChannelLeave.bind(this))
                .on("voiceChannelSwitch", eventHandlers.onVoiceChannelSwitch.bind(this))
                .on("guildDelete", eventHandlers.onGuildDelete.bind(this))
                .on("error", this.onError.bind(this));
        });
        if (config.debug) {
            this.client
                .on("debug", this.onDebug.bind(this))
                .on("warn", this.onWarn.bind(this));
        }
    }
    async onError(er) {
        this.logger.error(er);
        if (er.message?.startsWith("Invalid token") || er.cause?.message?.includes("401: Unauthorized")) {
            throw new Error("Invalid token detected. Please ensure that you set the correct token. You can also re-generate a new token for your bot.");
        }
        else {
            if (this.client.shards.some(shard => shard.status === "disconnected")) {
                this.logger.info("Attempt reconnecting after waiting for a while...");
                this._client.disconnect(true);
            }
            this.telemetry?.registerError(er);
        }
    }
    onDebug(message, id) {
        this.logger.trace(`${message} (ID: ${id || "NaN"})`);
    }
    onWarn(message, id) {
        this.logger.warn(`${message} (ID: ${id || "NaN"})`);
    }
    /**
     * Botを開始します。
     */
    run() {
        this._client.connect().catch(this.onError.bind(this));
    }
    async stop() {
        this.logger.info("Shutting down the bot...");
        this._client.removeAllListeners();
        this._client.on("error", () => { });
        if (this._backupper) {
            this.logger.info("Shutting down the db...");
            await this._backupper.destroy();
        }
        this._client.disconnect(false);
    }
    /**
     * コマンドを実行する際にランナーに渡す引数を生成します
     * @param options コマンドのパース済み引数
     * @param optiont コマンドの生の引数
     * @returns コマンドを実行する際にランナーに渡す引数
     */
    createCommandRunnerArgs(guildId, options, optiont, locale) {
        if (!this.guildData.has(guildId)) {
            throw new Error("The specified guild was not found.");
        }
        return {
            args: options,
            bot: this,
            server: this.guildData.get(guildId),
            rawArgs: optiont,
            client: this._client,
            initData: this.upsertData.bind(this),
            includeMention: false,
            locale,
            t: i18next_1.default.getFixedT(locale),
        };
    }
}
exports.MusicBot = MusicBot;
//# sourceMappingURL=bot.js.map