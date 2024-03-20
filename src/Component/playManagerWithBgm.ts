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

import type { PlayManagerPlayOptions } from "./playManager";

import { AudioPlayerStatus, entersState } from "@discordjs/voice";

import { PlayManager } from "./playManager";
import { GuildDataContainerWithBgm } from "../Structure/GuildDataContainerWithBgm";

type PlayManagerWithBgmPlayOptions = PlayManagerPlayOptions & {
  bgm?: boolean,
};

export class PlayManagerWithBgm extends PlayManager {
  protected override server: GuildDataContainerWithBgm;
  protected _bgm: boolean = false;
  protected _originalVolume: number = 100;
  protected get bgm(){
    return this._bgm;
  }
  protected set bgm(value: boolean){
    if(value && !this._bgm){
      this._originalVolume = this.volume;
      this.setVolume(this.server.bgmConfig.volume);
    }else if(!value && this._bgm){
      this.setVolume(this._originalVolume);
    }
    this._bgm = value;
    this.logger.debug(`BGM state changed: ${value ? "active" : "inactive"}`);
  }

  override get isPlaying(): boolean{
    return super.isPlaying && !this.server.queue.isBGM;
  }

  override async play({ bgm, ...options }: PlayManagerWithBgmPlayOptions = {}){
    if(typeof bgm === "undefined"){
      // if bgm is undefined, set the current state
      bgm = this.bgm;
    }
    if(this.server instanceof GuildDataContainerWithBgm){
      if((this.server.queue.isBGM && !bgm || !this.server.queue.isBgmEmpty && bgm) && this._player?.state.status === AudioPlayerStatus.Playing){
        await this.stop({ wait: true });
      }
      this.server.queue.setToPlayBgm(bgm);
    }
    if(!this.getIsBadCondition(bgm)) this.bgm = bgm;

    this.logger.debug(`BGM state { player: ${this.bgm}, queue: ${this.server.queue.isBGM} }`);

    return super.play(options);
  }

  protected override getIsBadCondition(bgm: boolean = this.bgm){
    this.logger.debug(`Condition: { connecting: ${this.isConnecting}, playing: ${this.isPlaying}, empty: ${this.server.queue.isEmpty}, bgm: ${bgm}, bgmEmpty: ${this.server.queue.isBgmEmpty} }`);
    // 接続していない
    return !this.isConnecting
      // なにかしら再生中
      || this.isPlaying
      // キューが空
      || (this.server.queue.isEmpty && (!bgm || this.server.queue.isBgmEmpty))
      // 準備中
      || this.preparing
    ;
  }

  protected override getNoticeNeeded(){
    return !!this.server.boundTextChannel && !this.bgm;
  }

  override disconnect(){
    const result = super.disconnect();
    this.server.queue.setToPlayBgm(false);
    return result;
  }

  protected override async onStreamFinished(){
    if(this._player?.state.status === AudioPlayerStatus.Playing){
      await entersState(this._player, AudioPlayerStatus.Idle, 20e3)
        .catch(() => {
          this.logger.warn("Stream has not ended in time and will force stream into destroying");
          return this.stop({ wait: true });
        })
      ;
    }
    // 再生が終わったら
    this._errorCount = 0;
    this._errorUrl = "";
    this._cost = 0;
    if(this.bgm){
      await this.server.queue.next();
      if(this.server.queue.isBgmEmpty){
        this.logger.info("Queue empty");
        await this.disconnect();
      }else{
        await this.play({ quietOnError: true, bgm: true });
      }
    }else{
      return super.onStreamFinished();
    }
  }
}
