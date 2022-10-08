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
import Util from "../Util";
import { PlayManager } from "./PlayManager";

export class PlayManagerWithBgm extends PlayManager {
  protected override server: GuildDataContainerWithBgm;
  private _bgm:boolean = false;

  override get isPlaying():boolean{
    return this.isConnecting && this.server.connection.playing && !this.server.queue.isBGM;
  }

  override async play(time?: number, bgm: boolean = false){
    if(this.server instanceof GuildDataContainerWithBgm){
      if(((this.server.queue.isBGM && !bgm) || (!this.server.queue.isBgmEmpty && bgm)) && this.server.connection?.playing){
        this.stop();
      }
      this.server.queue.setToPlayBgm(bgm);
    }
    if(!this.getIsBadCondition(bgm)) this._bgm = bgm;
    return super.play(time);
  }

  protected override getIsBadCondition(bgm:boolean = this._bgm){
    // 接続していない
    return !this.isConnecting
      // なにかしら再生中
      || this.isPlaying
      // キューが空
      || this.server.queue.isEmpty && (!bgm || this.server.queue.isBgmEmpty)
      // 準備中
      || this.preparing
    ;
  }

  protected override getNoticeNeeded(){
    return this.server.boundTextChannel && !this._bgm;
  }

  override disconnect(){
    const result = super.disconnect();
    this.server.queue.setToPlayBgm(false);
    return result;
  }

  override async onStreamFinished(){
    if(this.server.connection && this.server.connection.playing){
      await Util.general.waitForEnteringState(() => !this.server.connection || !this.server.connection.playing, 20 * 1000)
        .catch(() => {
          this.Log("Stream has not ended in time and will force stream into destroying", "warn");
          this.stop();
        })
      ;
    }
    // 再生が終わったら
    this._errorCount = 0;
    this._errorUrl = "";
    this._cost = 0;
    if(this._bgm){
      this.server.queue.next();
      if(this.server.queue.isBgmEmpty){
        this.Log("Queue empty");
        this.disconnect();
      }else{
        this.play(0, true);
      }
    }else{
      return super.onStreamFinished();
    }
  }
}
