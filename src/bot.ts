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

import type { CommandArgs } from "./Structure";

import i18next from "i18next";
import * as discord from "oceanic.js";

import { Telemetry } from "./Component/telemetry";
import { requireIfAny } from "./Util";
import { MusicBotBase } from "./botBase";
import { getConfig } from "./config";
import * as eventHandlers from "./events";

const config = getConfig();

/**
 * 音楽ボットの本体
 */
export class MusicBot extends MusicBotBase {
  // クライアントの初期化
  protected readonly _client: discord.Client;
  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private _isReadyFinished = false;

  get readyFinished() {
    return this._isReadyFinished;
  }

  private readonly _telemetry: Telemetry | null = null;

  get telemetry() {
    return this._telemetry;
  }

  // ready.ts で値を代入しているため
  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private _mentionText: `<@${string}>` = "" as `<@${string}>`;

  get mentionText() {
    return this._mentionText;
  }

  constructor(token: string, maintenance: boolean = false) {
    super(maintenance);

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
        compress: requireIfAny("zlib-sync") || requireIfAny("pako") ? "zlib-stream" : false,
      },
    });

    this._telemetry = process.env.DISABLE_TELEMETRY ? null : new Telemetry(this);

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
        .on("error", this.onError.bind(this))
      ;
    });
    if (config.debug) {
      this.client
        .on("debug", this.onDebug.bind(this))
        .on("warn", this.onWarn.bind(this))
      ;
    }
  }

  private async onError(er: Error) {
    this.logger.error(er);
    if (er.message?.startsWith("Invalid token") || (er.cause as Error | undefined)?.message?.includes("401: Unauthorized")) {
      throw new Error("Invalid token detected. Please ensure that you set the correct token. You can also re-generate a new token for your bot.");
    } else {
      if (this.client.shards.some(shard => shard.status === "disconnected")) {
        this.logger.info("Attempt reconnecting after waiting for a while...");
        this._client.disconnect(true);
      }

      this.telemetry?.registerError(er);
    }
  }

  private onDebug(message: string, id?: number) {
    this.logger.trace(`${message} (ID: ${id || "NaN"})`);
  }

  private onWarn(message: string, id?: number) {
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
    this._client.on("error", () => {});
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
  createCommandRunnerArgs(guildId: string, options: string[], optiont: string, locale: string): CommandArgs {
    if (!this.guildData.has(guildId)) {
      throw new Error("The specified guild was not found.");
    }

    return {
      args: options,
      bot: this,
      server: this.guildData.get(guildId)!,
      rawArgs: optiont,
      client: this._client,
      initData: this.upsertData.bind(this),
      includeMention: false,
      locale,
      t: i18next.getFixedT(locale),
    };
  }
}
