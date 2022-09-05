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

import type { LogLevels } from "../Util/log";

import { Util } from "../Util";

export abstract class LogEmitter {
  private tag:string = "";
  private guildId:string = "";
  /**
   * ログに使用するタグを設定します
   * @param tag タグ
   */
  SetTag(tag:string){
    this.tag = tag;
  }
  
  /**
   * ログに使用するサーバーIDを設定します（存在する場合）
   * @param id id
   */
  SetGuildId(id:string){
    this.guildId = id;
  }

  /**
   * ログを出力します
   * @param message メッセージ
   */
  Log(message:string, level?:LogLevels){
    if(this.tag === "") throw new Error("Tag has not been specified");
    Util.logger.log(`[${this.tag}${this.guildId !== "" ? `/${this.guildId}` : ""}]${message}`, level);
  }
}
