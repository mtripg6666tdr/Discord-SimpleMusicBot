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

import type { YmxFormat } from "../../Structure";
import type { DataType } from "../../botBase";

import { LogEmitter } from "../../Structure";

export type exportableStatuses = {
  voiceChannelId:string,
  boundChannelId:string,
  loopEnabled:boolean,
  queueLoopEnabled:boolean,
  addRelatedSongs:boolean,
  equallyPlayback:boolean,
  volume:number,
};

export abstract class Backupper extends LogEmitter {
  abstract get backuppable():boolean;

  constructor(protected readonly getData:(() => DataType)){
    super();
    this.setTag("Backup");
  }
  abstract backup():Promise<void>|void;
  abstract backupQueue():Promise<void>;
  abstract backupStatus():Promise<void>;
  abstract getStatusFromBackup(guildids:string[]):Promise<Map<string, exportableStatuses>>;
  abstract getQueueDataFromBackup(guildids:string[]):Promise<Map<string, YmxFormat>>;
}
