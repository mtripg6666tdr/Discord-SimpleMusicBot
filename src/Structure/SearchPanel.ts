/*
 * Copyright 2021-2022 mtripg6666tdr
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

import type { CommandMessage } from "../Component/CommandMessage";

export type SearchPanel = {
  /**
   * 検索窓のメッセージを保存します
   */
  Msg: {
    /**
     * 検索窓のメッセージID
     */
    id: string,
    /**
     * 検索窓のチャンネルID
     */
    chId: string,
    /**
     * 検索したユーザーのID
     */
    userId: string,
    /**
     * 検索者のユーザー名
     */
    userName: string,
    /**
     * 検索が要求されたときのメッセージ
     */
    commandMessage: CommandMessage,
  },
  /**
   * 検索窓の内容を保存します
   */
  Opts: {[num:number]: VideoInfo},
};

type VideoInfo = {
  url:string,
  title:string,
  duration:string,
  thumbnail:string,
};
