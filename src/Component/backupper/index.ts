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

import type { YmxFormat } from "../../Structure";
import type { DataType, MusicBotBase } from "../../botBase";

import { LogEmitter } from "../../Structure";

export type exportableStatuses = {
  voiceChannelId: string,
  boundChannelId: string,
  loopEnabled: boolean,
  queueLoopEnabled: boolean,
  addRelatedSongs: boolean,
  equallyPlayback: boolean,
  volume: number,
};

export abstract class Backupper extends LogEmitter {
  /**
   * 初期化時に与えられたアクセサを使って、サーバーのデータを返します。
   */
  protected get data() {
    return this.getData();
  }

  constructor(protected readonly bot: MusicBotBase, protected readonly getData: () => DataType) {
    super();
    this.setTag("Backup");
  }
  /**
   * バックアップ済みの接続ステータス等を取得します
   */
  abstract getStatusFromBackup(guildids: string[]): Promise<Map<string, exportableStatuses>>;
  /**
   * バックアップ済みのキューのデータを取得します
   */
  abstract getQueueDataFromBackup(guildids: string[]): Promise<Map<string, YmxFormat>>;
  /**
   * サーバーとの接続を破棄します
   */
  abstract destroy(): void | Promise<void>;
}
