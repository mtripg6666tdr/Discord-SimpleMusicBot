/*
 * Copyright 2021-2023 mtripg6666tdr
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

import * as discord from "oceanic.js";

import { Util } from "./Util";
import { MusicBotBase } from "./botBase";
import * as eventHandlers from "./events";

/**
 * 音楽ボットの本体
 */
export class MusicBot extends MusicBotBase {
  // クライアントの初期化
  protected readonly _client = null as discord.Client;
  private readonly _addOn = new Util.addOn.AddOn();
  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private _isReadyFinished = false;

  get addOns(){
    return this._addOn;
  }

  get readyFinished(){
    return this._isReadyFinished;
  }

  constructor(token: string, maintenance: boolean = false){
    super(maintenance);

    this._client = new discord.Client({
      auth: `Bot ${token}`,
      gateway: {
        intents: Util.config.noMessageContent ? [
          "GUILDS",
          "GUILD_MESSAGES",
          "GUILD_VOICE_STATES",
        ] : [
          "GUILDS",
          "GUILD_MESSAGES",
          "GUILD_VOICE_STATES",
          "MESSAGE_CONTENT",
        ],
        compress: (() => {
          try{
            return !!require("zlib-sync");
          }
          catch{
            return false;
          }
        })(),
      },
    });

    this.client
      .on("ready", eventHandlers.onReady.bind(this))
      .on("messageCreate", eventHandlers.onMessageCreate.bind(this))
      .on("interactionCreate", eventHandlers.onInteractionCreate.bind(this))
      .on("voiceChannelJoin", eventHandlers.onVoiceChannelJoin.bind(this))
      .on("voiceChannelLeave", eventHandlers.onVoiceChannelLeave.bind(this))
      .on("voiceChannelSwitch", eventHandlers.onVoiceChannelSwitch.bind(this))
      .on("error", this.onError.bind(this))
    ;
    if(Util.config.debug){
      this.client
        .on("debug", this.onDebug.bind(this))
        .on("warn", this.onWarn.bind(this))
      ;
    }
  }

  private async onError(er: Error){
    Util.logger.log(er, "error");
    if(er.message?.startsWith("Invalid token")){
      this.Log("Invalid token detected. Please ensure that you set the correct token. You can also re-generate new token for your bot.");
      process.exit(1);
    }else{
      this.Log("Attempt reconnecting after waiting for a while...");
      this._client.disconnect(true);
    }
  }

  private onDebug(message: string, id?: number){
    this.Log(`${message} (ID: ${id || "NaN"})`, "debug");
  }

  private onWarn(message: string, id?: number){
    this.Log(`${message} (ID: ${id || "NaN"})`, "warn");
  }

  /**
   * Botを開始します。
   * @param debugLog デバッグログを出力するかどうか
   * @param debugLogStoreLength デバッグログの保存する数
   */
  run(debugLog: boolean = false, debugLogStoreLength?: number){
    this._client.connect().catch(e => this.Log(e, "error"));
    Util.logger.logStore.log = debugLog;
    if(debugLogStoreLength) Util.logger.logStore.maxLength = debugLogStoreLength;
  }

  async stop(){
    this.Log("Shutting down the bot...");
    this._client.removeAllListeners();
    this._client.on("error", () => {});
    if(this._backupper){
      this.Log("Shutting down the db...");
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
  createCommandRunnerArgs(guildId: string, options: string[], optiont: string): CommandArgs{
    return {
      embedPageToggle: this._embedPageToggle,
      args: options,
      bot: this,
      server: this.guildData.get(guildId),
      rawArgs: optiont,
      client: this._client,
      initData: this.initData.bind(this),
      includeMention: false,
    };
  }
}
