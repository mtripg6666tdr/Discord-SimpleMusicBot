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

import type { DataType } from "../botBase";

import { LogEmitter } from "../Structure";
import Util from "../Util";

export class BackUpper extends LogEmitter {
  private _queueModifiedGuilds:string[] = [];
  private _previousStatuses:{[guildId:string]:string} = {};
  private get data(){
    return this.getData();
  }

  get queueModifiedGuilds():Readonly<string[]>{
    return this._queueModifiedGuilds;
  }

  constructor(private readonly getData:(()=>DataType)){
    super();
    this.setTag("Backup");
  }

  resetModifiedGuilds(){
    this._queueModifiedGuilds = [];
  }

  addModifiedGuilds(guildId:string){
    if(!this._queueModifiedGuilds.includes(guildId)) this._queueModifiedGuilds.push(guildId);
  }
  
  /**
   * 接続ステータスやキューを含む全データをサーバーにバックアップします
   */
  backupData():Promise<any>|void{
    if(Util.db.DatabaseAPI.CanOperate){
      return this.backupQueue().then(() => this.backupStatus());
    }
  }

  /**
   * キューをサーバーにバックアップします
   */
  async backupQueue(){
    try{
      const queue = this._queueModifiedGuilds.map(id => ({
        guildid: id,
        queue: JSON.stringify(this.data[id].exportQueue())
      }));
      if(queue.length > 0){
        Util.logger.log("[Backup] Backing up modified queue...");
        await Util.db.DatabaseAPI.SetQueueData(queue);
        this._queueModifiedGuilds = [];
      }else{
        Util.logger.log("[Backup] No modified queue found, skipping");
      }
    }
    catch(e){
      this.Log(e, "error");
    }
  }

  /**
   * 接続ステータス等をサーバーにバックアップします
   */
  async backupStatus(){
    try{
      // 参加ステータスの送信
      const speaking = [] as {guildid:string, value:string}[];
      const currentStatuses = {} as {[guildId:string]:string};
      Object.keys(this.data).forEach(id => {
        const currentStatus = this.data[id].exportStatus();
        if(!this._previousStatuses[id] || this._previousStatuses[id] !== currentStatus){
          speaking.push({
            guildid: id,
            value: currentStatus,
          });
          currentStatuses[id] = currentStatus;
        }
      });
      if(speaking.length > 0){
        Util.logger.log("[Backup] Backing up modified status..");
        await Util.db.DatabaseAPI.SetIsSpeaking(speaking);
        this._previousStatuses = currentStatuses;
      }else{
        Util.logger.log("[Backup] No modified status found, skipping");
      }
    }
    catch(e){
      this.Log(e, "warn");
    }
  }
}
