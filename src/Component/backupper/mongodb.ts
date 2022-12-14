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

import type { exportableStatuses } from ".";
import type { GuildDataContainer, YmxFormat } from "../../Structure";
import type { DataType, MusicBotBase } from "../../botBase";
import type { Collection } from "mongodb";

import { MongoClient } from "mongodb";
import { debounce } from "throttle-debounce";

import { Backupper } from ".";
import Util from "../../Util";

type Collectionate<T> = T & {guildId:string};

export class MongoBackupper extends Backupper {
  private readonly client:MongoClient = null;
  private dbConnectionReady = false;
  private dbError:Error = null;
  collections: {
    status: Collection<Collectionate<exportableStatuses>>,
    queue: Collection<Collectionate<YmxFormat>>,
  } = null;

  static get backuppable(){
    return process.env.GAS_URL && (process.env.GAS_URL.startsWith("mongodb://") || process.env.GAS_URL.startsWith("mongodb+srv://"));
  }

  constructor(bot:MusicBotBase, getData: () => DataType){
    super(bot, getData);
    this.Log("Initializing Mongo DB backup server adapter...");
    this.client = new MongoClient(process.env.GAS_URL, {
      appName: `mtripg6666tdr/Discord-SimpleMusicBot#${this.bot.version || "unknown"} MondoDB backup server adapter`,
    });
    this.client.connect()
      .then(() => {
        this.Log("Database connection ready");
        const db = this.client.db(process.env.GAS_TOKEN || "discord_music_bot_backup");
        this.collections = {
          status: db.collection<Collectionate<exportableStatuses>>("Status"),
          queue: db.collection<Collectionate<YmxFormat>>("Queue"),
        };
        this.dbConnectionReady = true;
      })
      .catch(e => {
        this.Log(e, "error");
        this.Log("Database connection failed", "warn");
        this.dbError = e;
      })
    ;
    this.bot.on("beforeReady", () => {
      const backupStatusDebounceFunctions = Object.create(null);
      const backupStatusFuncFactory = (guildId:string) => {
        return backupStatusDebounceFunctions[guildId] || (backupStatusDebounceFunctions[guildId] = debounce(5000, () => this.backupStatus(guildId)));
      };
      const backupQueueDebounceFunctions = Object.create(null);
      const backupQueueFuncFactory = (guildId:string) => {
        return backupQueueDebounceFunctions[guildId] || (backupQueueDebounceFunctions[guildId] = debounce(5000, () => this.backupQueue(guildId)));
      };
      const setContainerEvent = (container:GuildDataContainer) => {
        (["change", "changeWithoutCurrent"] as const).forEach(eventName => container.queue.on(eventName, backupQueueFuncFactory(container.guildId)));
        container.queue.on("settingsChanged", backupStatusFuncFactory(container.guildId));
        container.player.on("all", backupStatusFuncFactory(container.guildId));
      };
      this.data.forEach(setContainerEvent);
      this.bot.on("guildDataAdded", setContainerEvent);
      this.bot.on("onBotVoiceChannelJoin", (channel) => backupStatusFuncFactory(channel.guild.id)());
      this.Log("Hook was set up successfully");
    });
  }

  async backupStatus(guildId:string){
    if(!MongoBackupper.backuppable || !this.dbConnectionReady) return;
    try{
      this.Log(`Backing up status...(${guildId})`);
      const status = this.data.get(guildId).exportStatus();
      await this.collections.status.updateOne({guildId}, {
        "$set": {
          guildId,
          ...status
        },
      }, {
        upsert: true,
      });
    }
    catch(er){
      this.Log(er, "error");
      this.Log("Something went wrong while backing up status");
    }
  }

  backupQueue(guildId:string){
    if(!MongoBackupper.backuppable || !this.dbConnectionReady) return;
    try{
      const queue = this.data.get(guildId).exportQueue();
      this.Log(`Backing up queue...(${guildId})`);
      this.collections.queue.updateOne({guildId}, {
        "$set": {
          guildId,
          ...queue
        },
      }, {
        upsert: true,
      });
    }
    catch(er){
      this.Log(er, "error");
      this.Log("Something went wrong while backing up queue");
    }
  }

  override async getStatusFromBackup(guildIds: string[]): Promise<Map<string, exportableStatuses>>{
    if(!this.dbConnectionReady && !this.dbError) await Util.general.waitForEnteringState(() => this.dbConnectionReady || !!this.dbError, Infinity);
    if(this.dbError){
      this.Log("Database connecting failed!!", "warn");
      return null;
    }
    try{
      const dbResult = this.collections.status.find({
        "$or": guildIds.map(id => ({
          guildId: id
        })),
      });
      const result = new Map<string, exportableStatuses>();
      await dbResult.forEach(doc => {
        result.set(doc.guildId, doc);
      });
      return result;
    }
    catch(er){
      this.Log(er, "error");
      this.Log("Status restoring failed!", "error");
      return null;
    }
  }

  override async getQueueDataFromBackup(guildids: string[]): Promise<Map<string, YmxFormat>>{
    if(!this.dbConnectionReady && !this.dbError) await Util.general.waitForEnteringState(() => this.dbConnectionReady || !!this.dbError, Infinity);
    if(this.dbError){
      this.Log("Database connecting failed!!", "warn");
      return null;
    }
    try{
      const dbResult = this.collections.queue.find({
        "$or": guildids.map(id => ({
          guildId: id
        })),
      });
      const result = new Map<string, YmxFormat>();
      await dbResult.forEach(doc => {
        result.set(doc.guildId, doc);
      });
      return result;
    }
    catch(er){
      this.Log(er, "error");
      this.Log("Queue restoring failed!", "error");
      return null;
    }
  }
}
