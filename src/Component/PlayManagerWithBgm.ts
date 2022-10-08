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

import { GuildDataContainerWithBgm } from "../Structure/GuildDataContainerWithBgm";
import { PlayManager } from "./PlayManager";

export class PlayManagerWithBgm extends PlayManager {
  protected override server: GuildDataContainerWithBgm;
  private _bgm:boolean = false;

  override get isPlaying():boolean{
    return this.isConnecting && this.server.connection.playing && this.server.queue.isBGM;
  }

  override async play(time?: number, bgm: boolean = false){
    if(this.server instanceof GuildDataContainerWithBgm){
      if(this.server.queue.isBGM && !bgm && this.server.connection?.playing){
        this.stop();
      }
      this.server.queue.setToPlayBgm(bgm);
    }
    this._bgm = bgm;
    return super.play(time);
  }

  protected override getIsBadCondition(){
    // 接続していない
    return !this.isConnecting
      // なにかしら再生中
      || this.isPlaying
      // キューが空
      || this.getQueueEmpty()
      // 準備中
      || this.preparing
    ;
  }

  protected override getNoticeNeeded(){
    return this.server.boundTextChannel && !this._bgm;
  }

  protected override getQueueEmpty(){
    return this.server.queue.isEmpty && (!this._bgm || this.server.queue.isBgmEmpty);
  }

  protected override playAfterFinished(time?: number){
    this.play(time, this.server.queue.isBGM);
  }
}
