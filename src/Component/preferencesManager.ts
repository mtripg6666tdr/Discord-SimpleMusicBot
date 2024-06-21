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

import { GuildDataContainer } from "../Structure/GuildDataContainer";
import { ServerManagerBase } from "../Structure/ServerManagerBase";
import { emitEventOnMutation } from "../Util/decorators";
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
    this.nowPlayingNotificationLevel = NowPlayingNotificationLevel.Normal;
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


  /** 関連動画自動追加が有効 */
  @emitEventOnMutation("updateSettings")
  accessor addRelated: boolean;

  /** 均等再生が有効 */
  @emitEventOnMutation("updateSettings")
  accessor equallyPlayback: boolean;

  /** スキップ投票を無効にするか */
  @emitEventOnMutation("updateSettings")
  accessor disableSkipSession: boolean;

  /** 現在再生中パネルの表示レベル */
  @emitEventOnMutation("updateSettings")
  accessor nowPlayingNotificationLevel: NowPlayingNotificationLevel;
}
