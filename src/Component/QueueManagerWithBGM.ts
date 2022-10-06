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

import type { AddedBy, QueueContent } from "../Structure/QueueContent";
import type { KnownAudioSourceIdentifer} from "./QueueManager";
import type { Member } from "eris";

import * as fs from "fs";
import * as path from "path";

import * as AudioSource from "../AudioSource";
import { QueueManager } from "./QueueManager";

export class QueueManagerWithBGM extends QueueManager {
  protected _bgmDefault:QueueContent[] = [];

  moveCurrentTracksToBGM(){
    this._bgmDefault = [...this._default];
    this._default = [];
  }

  override async addQueue(
    url:string,
    addedBy:Member|AddedBy,
    method:"push"|"unshift" = "push",
    type:KnownAudioSourceIdentifer = "unknown",
    gotData:AudioSource.exportableCustom = null,
    preventCache:boolean = false,
  ):Promise<QueueContent & {index:number}>{
    if(!url.startsWith("http://") && !url.startsWith("https://") && fs.existsSync(path.join(__dirname, "../../", url))){
      const result = {
        basicInfo: await (new AudioSource.FsStream().init(url)),
        additionalInfo: {
          addedBy: {
            userId: this.getUserIdFromMember(addedBy) ?? "0",
            displayName: this.getDisplayNameFromMember(addedBy) ?? "不明"
          }
        }
      } as QueueContent;
      this._default[method](result);
      if(this.server.equallyPlayback) this.sortWithAddedBy();
      const index = this._default.findIndex(q => q === result);
      return {...result, index};
    }
    return super.addQueue(url, addedBy, method, type, gotData, preventCache);
  }
}
