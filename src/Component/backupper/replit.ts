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

import type { YmxFormat } from "../../Structure";
import type { DataType, MusicBotBase } from "../../botBase";
import type { JSONStatuses } from "../../types/GuildStatuses";

import { IntervalBackupper } from ".";
import { measureTime } from "../../Util/decorators";
import { ReplitClient } from "../replitDatabaseClient";

export class ReplitBackupper extends IntervalBackupper {
  protected readonly db: ReplitClient = null!;

  static get backuppable(){
    return process.env.DB_URL?.startsWith("replit+http");
  }

  constructor(bot: MusicBotBase, getData: () => DataType){
    super(bot, getData, "Replit");

    this.db = new ReplitClient(process.env.DB_URL!.substring("replit+".length));

    this.bot.client.on("guildDelete", ({ id }) => {
      Promise.allSettled([
        this.db.delete(this.getDbKey("status", id)),
        this.db.delete(this.getDbKey("queue", id)),
      ]).catch(this.logger.error);
    });
  }

  @measureTime
  protected override async backupStatus(){
    if(!this.db) return;

    // determine which data should be backed up
    const filteredGuildIds = this.getStatusModifiedGuildIds();

    // execute
    for(let i = 0; i < filteredGuildIds.length; i++){
      const guildId = filteredGuildIds[i];
      try{
        this.logger.info(`Backing up status...(${guildId})`);
        const currentStatus = this.data.get(guildId)?.exportStatus();
        if(!currentStatus) continue;
        await this.db.set(this.getDbKey("status", guildId), currentStatus);
        this.updateStatusCache(guildId, currentStatus);
      }
      catch(er){
        this.logger.error(er);
        this.logger.info("Something went wrong while backing up status");
      }
    }
  }

  @measureTime
  protected override async backupQueue(){
    if(!this.db) return;
    const modifiedGuildIds = this.getQueueModifiedGuildIds();
    for(let i = 0; i < modifiedGuildIds.length; i++){
      const guildId = modifiedGuildIds[i];
      try{
        this.logger.info(`Backing up queue...(${guildId})`);
        const queue = this.data.get(guildId)?.exportQueue();
        if(!queue) continue;
        await this.db.set(this.getDbKey("queue", guildId), queue);
        this.unmarkQueueModifiedGuild(guildId);
      }
      catch(er){
        this.logger.error(er);
        this.logger.info("Something went wrong while backing up queue");
      }
    }
  }

  @measureTime
  override async getQueueDataFromBackup(guildIds: string[]) {
    const result = new Map<string, YmxFormat>();
    try{
      await Promise.allSettled(
        guildIds.map(async id => {
          const queue = await this.db.get<YmxFormat>(this.getDbKey("queue", id));
          if(queue){
            result.set(id, queue);
          }
        })
      );
      return result;
    }
    catch(er){
      this.logger.error(er);
      this.logger.error("Queue restoring failed!");
      return null;
    }
  }

  @measureTime
  override async getStatusFromBackup(guildIds: string[]) {
    const result = new Map<string, JSONStatuses>();
    try{
      await Promise.allSettled(
        guildIds.map(async id => {
          const status = await this.db.get<JSONStatuses>(this.getDbKey("status", id));
          if(status){
            result.set(id, status);
            this.updateStatusCache(id, status);
          }
        })
      );
      return result;
    }
    catch(er){
      this.logger.error(er);
      this.logger.error("Status restoring failed!");
      return null;
    }
  }

  private getDbKey(type: "status" | "queue", guildId: string){
    return `dsmb-${type === "status" ? "s" : "q"}-${guildId}`;
  }

  override destroy(){
  }
}
