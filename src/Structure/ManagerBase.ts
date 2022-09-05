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

import type { GuildDataContainer } from "./GuildDataContainer";

import { LogEmitter } from "../Structure";

/**
 * すべてのマネージャークラスの基底クラスです
 */
export abstract class ManagerBase extends LogEmitter {
  // 親ノード
  protected server:GuildDataContainer = null;

  /**
   * 親となるGuildVoiceInfoをセットする関数（一回のみ呼び出せます）
   * @param data 親のGuildVoiceInfo
   */
  setBinding(data:GuildDataContainer){
    if(this.server) throw new Error("すでに設定されています");
    this.server = data;
    this.SetGuildId(this.server.guildID);
  }
}
