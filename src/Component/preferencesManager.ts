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

import { GuildDataContainer } from "../Structure/GuildDataContainer";
import { ServerManagerBase } from "../Structure/ServerManagerBase";
import { JSONGuildPreferences, NowPlayingNotificationLevel } from "../types/GuildPreferences";

interface GuildPreferencesEvents {
  updateSettings: [];
}

export class GuildPreferencesManager extends ServerManagerBase<GuildPreferencesEvents> {
  constructor(parent: GuildDataContainer){
    super("GuildPreferencesManager", parent);
    this.logger.info("GuildPreferencesManager initialized.");

    this.init();
  }

  protected init(){
    this.addRelated = false;
    this.equallyPlayback = false;
    this.disableSkipSession = false;
  }

  exportPreferences(): JSONGuildPreferences {
    return {
      addRelatedSongs: this.addRelated,
      equallyPlayback: this.equallyPlayback,
      disableSkipSession: this.disableSkipSession,
      nowPlayingNotificationLevel: this.nowPlayingNotificationLevel,
    };
  }

  importPreferences(preferences: JSONGuildPreferences){
    this.addRelated = preferences.addRelatedSongs;
    this.equallyPlayback = preferences.equallyPlayback;
    this.disableSkipSession = preferences.disableSkipSession;
    this.nowPlayingNotificationLevel = preferences.nowPlayingNotificationLevel;
  }


  protected _addRelated: boolean;
  /** 関連動画自動追加が有効 */
  get addRelated(){
    return this._addRelated;
  }
  set addRelated(value: boolean){
    if(this._addRelated !== value){
      this.emit("updateSettings");
    }

    this._addRelated = value;
  }


  protected _equallyPlayback: boolean;
  /** 均等再生が有効 */
  get equallyPlayback(){
    return this._equallyPlayback;
  }
  set equallyPlayback(value: boolean){
    if(this._equallyPlayback !== value){
      this.emit("updateSettings");
    }

    this._equallyPlayback = value;
  }


  protected _disableSkipSession: boolean;
  /** スキップ投票を無効にするか */
  get disableSkipSession(){
    return this._disableSkipSession;
  }
  set disableSkipSession(value: boolean){
    if(this._disableSkipSession !== value){
      this.emit("updateSettings");
    }

    this._disableSkipSession = value;
  }


  protected _nowPlayingNotificationLevel: NowPlayingNotificationLevel;
  get nowPlayingNotificationLevel(){
    return this._nowPlayingNotificationLevel;
  }
  set nowPlayingNotificationLevel(value: NowPlayingNotificationLevel){
    if(this._nowPlayingNotificationLevel !== value){
      this.emit("updateSettings");
    }

    this._nowPlayingNotificationLevel = value;
  }
}
