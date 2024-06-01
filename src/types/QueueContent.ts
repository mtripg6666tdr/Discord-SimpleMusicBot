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

import type { AudioSource, AudioSourceBasicJsonFormat } from "../AudioSource";

/**
 * キューの内容を示します
 */
export type QueueContent = {
  /**
   * 曲自体のメタ情報
   */
  basicInfo: AudioSource<any, any>,
  /**
   * 曲の情報とは別の追加情報
   */
  additionalInfo: AdditionalInfo,
};

export type AddedBy = {
  /**
   * 曲の追加者の表示名。表示名は追加された時点での名前になります。
   */
  displayName: string,
  /**
   * 曲の追加者のユーザーID
   */
  userId: string,
};

/**
 * 曲の情報とは別の追加情報を示します。
 */
export type AdditionalInfo = {
  /**
   * 曲の追加者を示します
   */
  addedBy: AddedBy,
};

/**
 * エクスポート可能なキューのアイテムです
 */
export type ExportableQueueContent = AudioSourceBasicJsonFormat & {
  addBy: AddedBy,
};
