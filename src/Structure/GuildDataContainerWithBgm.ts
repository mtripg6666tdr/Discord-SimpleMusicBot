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

import type { GuildBGMContainerType } from "../Util/config";
import type { MusicBotBase } from "../botBase";

import { PlayManagerWithBgm } from "../Component/PlayManagerWithBgm";
import { QueueManagerWithBgm } from "../Component/QueueManagerWithBGM";
import { GuildDataContainer } from "./GuildDataContainer";

export class GuildDataContainerWithBgm extends GuildDataContainer {
  protected override _queue:QueueManagerWithBgm;
  override get queue(){
    return this._queue;
  }

  protected override _player: PlayManagerWithBgm;
  override get player(){
    return this._player;
  }

  protected _bgmConfig:GuildBGMContainerType;
  get bgmConfig():Readonly<GuildBGMContainerType>{
    return this._bgmConfig;
  }

  protected override initPlayManager(){
    this._player = new PlayManagerWithBgm();
    this._player.setBinding(this);
  }

  protected override initQueueManager(){
    this._queue = new QueueManagerWithBgm();
    this._queue.setBinding(this);
  }

  constructor(guildid:string, boundchannelid:string, bot:MusicBotBase, bgmConfig:GuildBGMContainerType){
    super(guildid, boundchannelid, bot);
    this._bgmConfig = bgmConfig;
  }

  /**
   * BGM設定が存在する場合に、BGM設定を完了します
   */
  async initBgmTracks(){
    if(this.bgmConfig){
      const { items } = this.bgmConfig;
      for(let i = 0; i < items.length; i++){
        await this.queue.addQueue(items[i], {
          displayName: "システム",
          userId: "0"
        }, "push", "unknown", {
          title: "BGM",
          url: items[i],
          length: -1
        }, /* preventCache */ true);
      }
      this.queue.moveCurrentTracksToBGM();
    }
  }

  playBgmTracks(){
    if(!this.bgmConfig) throw new Error("no bgm configuration found!");
    if(!this.bgmConfig.enableQueueLoop){
      this.queue.resetBgmTracks();
    }
    return this._joinVoiceChannel(this.bgmConfig.voiceChannelId)
      .then(() => {
        this.player.setVolume(this.bgmConfig.volume);
        this.player.play(0, /* BGM */ true);
      })
      .catch(er => this.Log(er, "error"))
    ;
  }
}
