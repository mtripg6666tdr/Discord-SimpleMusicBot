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

import type { GuildDataContainer, YmxFormat } from "../../Structure";
import type { DataType, MusicBotBase } from "../../botBase";

import { isDeepStrictEqual } from "util";

import { LogEmitter } from "../../Structure";
import { JSONStatuses } from "../../types/GuildStatuses";

// eslint-disable-next-line @typescript-eslint/ban-types
export abstract class Backupper extends LogEmitter<{}> {
  /**
   * 初期化時に与えられたアクセサを使って、サーバーのデータを返します。
   */
  protected get data() {
    return this.getData();
  }

  constructor(protected readonly bot: MusicBotBase, protected readonly getData:(() => DataType)) {
    super("Backup");
  }
  /**
   * バックアップ済みの接続ステータス等を取得します
   */
  abstract getStatusFromBackup(guildIds: string[]): Promise<Map<string, JSONStatuses> | null>;
  /**
   * バックアップ済みのキューのデータを取得します
   */
  abstract getQueueDataFromBackup(guildIds: string[]): Promise<Map<string, YmxFormat> | null>;
  /**
   * サーバーとの接続を破棄します
   */
  abstract destroy(): void | Promise<void>;
}

export abstract class IntervalBackupper extends Backupper {
  private readonly queueModifiedGuild = new Set<string>();
  private readonly previousStatusCache = new Map<string, string>();

  constructor(bot: MusicBotBase, getData: () => DataType, name: string) {
    super(bot, getData);

    this.logger.info(`Initializing ${name} Database backup server adapter...`);

    // ボットの準備完了直前に実行する
    this.bot.once("beforeReady", () => {
      // コンテナにイベントハンドラを設定する関数
      const setContainerEvent = (container: GuildDataContainer) => {
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

  private async backup() {
    await this.backupStatus();
    await this.backupQueue();
  }

  protected updateStatusCache(guildId: string, status: JSONStatuses) {
    this.previousStatusCache.set(guildId, JSON.stringify(status));
  }

  protected getQueueModifiedGuildIds() {
    return [...this.queueModifiedGuild.keys()];
  }

  protected unmarkQueueModifiedGuild(guildId: string) {
    this.queueModifiedGuild.delete(guildId);
  }

  protected unmarkAllQueueModifiedGuild() {
    this.queueModifiedGuild.clear();
  }

  protected getStatusModifiedGuildIds() {
    return [...this.data.keys()]
      .filter(id => {
        if (!this.previousStatusCache.has(id)) {
          return true;
        } else {
          return !isDeepStrictEqual(this.data.get(id)!.exportStatus(), JSON.parse(this.previousStatusCache.get(id)!));
        }
      });
  }

  protected abstract backupStatus(): Promise<void>;

  protected abstract backupQueue(): Promise<void>;
}
