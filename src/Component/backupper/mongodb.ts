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

import type { exportableStatuses } from ".";
import type { GuildDataContainer, YmxFormat } from "../../Structure";
import type { DataType, MusicBotBase } from "../../botBase";
import type * as mongo from "mongodb";

import { MongoClient } from "mongodb";
import { debounce } from "throttle-debounce";

import { Backupper } from ".";
import { waitForEnteringState } from "../../Util";

type Collectionate<T> = T & { guildId: string };
type Analytics = Collectionate<{
  totalDuration: number,
  errorCount: number,
}>;

export class MongoBackupper extends Backupper {
  private readonly client: mongo.MongoClient = null;
  private dbConnectionReady = false;
  private dbError: Error = null;
  collections: {
    status: mongo.Collection<Collectionate<exportableStatuses>>,
    queue: mongo.Collection<Collectionate<YmxFormat>>,
    analytics: mongo.Collection<Analytics>,
  } = null;

  static get backuppable(){
    return process.env.GAS_URL && (process.env.GAS_URL.startsWith("mongodb://") || process.env.GAS_URL.startsWith("mongodb+srv://"));
  }

  constructor(bot: MusicBotBase, getData: () => DataType){
    super(bot, getData);
    this.logger.info("Initializing Mongo DB backup server adapter...");
    this.client = new MongoClient(process.env.GAS_URL, {
      appName: `mtripg6666tdr/Discord-SimpleMusicBot#${this.bot.version || "unknown"} MondoDB backup server adapter`,
    });
    this.client.connect()
      .then(() => {
        this.logger.info("Database connection ready");
        const db = this.client.db(process.env.GAS_TOKEN || "discord_music_bot_backup");
        this.collections = {
          status: db.collection<Collectionate<exportableStatuses>>("Status"),
          queue: db.collection<Collectionate<YmxFormat>>("Queue"),
          analytics: db.collection<Analytics>("Analytics"),
        };
        this.dbConnectionReady = true;
      })
      .catch(e => {
        this.logger.error(e);
        this.logger.warn("Database connection failed");
        this.dbError = e;
      })
    ;
    this.bot.on("beforeReady", () => {
      const backupStatusDebounceFunctions = Object.create(null);
      const backupStatusFuncFactory = (guildId: string) => {
        if(backupStatusDebounceFunctions[guildId]){
          return backupStatusDebounceFunctions[guildId];
        }else{
          return backupStatusDebounceFunctions[guildId] = debounce(5000, () => this.backupStatus(guildId));
        }
      };
      const backupQueueDebounceFunctions = Object.create(null);
      const backupQueueFuncFactory = (guildId: string) => {
        if(backupQueueDebounceFunctions[guildId]){
          return backupQueueDebounceFunctions[guildId];
        }else{
          return backupQueueDebounceFunctions[guildId] = debounce(5000, () => this.backupQueue(guildId));
        }
      };
      const setContainerEvent = (container: GuildDataContainer) => {
        container.queue.eitherOn(["change", "changeWithoutCurrent"], backupQueueFuncFactory(container.getGuildId()));
        container.queue.on("settingsChanged", backupStatusFuncFactory(container.getGuildId()));
        container.player.on("all", backupStatusFuncFactory(container.getGuildId()));
        container.player.on("reportPlaybackDuration", this.addPlayerAnalyticsEvent.bind(this, container.getGuildId()));
      };
      this.data.forEach(setContainerEvent);
      this.bot.on("guildDataAdded", setContainerEvent);
      this.bot.on("onBotVoiceChannelJoin", (channel) => backupStatusFuncFactory(channel.guild.id)());
      this.logger.info("Hook was set up successfully");
    });
  }

  async backupStatus(guildId: string){
    if(!MongoBackupper.backuppable || !this.dbConnectionReady) return;
    try{
      this.logger.info(`Backing up status...(${guildId})`);
      const status = this.data.get(guildId).exportStatus();
      await this.collections.status.updateOne({ guildId }, {
        "$set": {
          guildId,
          ...status,
        },
      }, {
        upsert: true,
      });
    }
    catch(er){
      this.logger.error(er);
      this.logger.info("Something went wrong while backing up status");
    }
  }

  backupQueue(guildId: string){
    if(!MongoBackupper.backuppable || !this.dbConnectionReady) return;
    try{
      const queue = this.data.get(guildId).exportQueue();
      this.logger.info(`Backing up queue...(${guildId})`);
      this.collections.queue.updateOne({ guildId }, {
        "$set": {
          guildId,
          ...queue,
        },
      }, {
        upsert: true,
      });
    }
    catch(er){
      this.logger.error(er);
      this.logger.warn("Something went wrong while backing up queue");
    }
  }

  async addPlayerAnalyticsEvent(guildId: string, totalDuration: number, errorCount: number){
    if(!MongoBackupper.backuppable || !this.dbConnectionReady) return;
    try{
      await this.collections.analytics.insertOne({ guildId, totalDuration, errorCount });
    }
    catch(er){
      this.logger.error(er);
    }
  }

  override async getStatusFromBackup(guildIds: string[]): Promise<Map<string, exportableStatuses>>{
    if(!this.dbConnectionReady && !this.dbError) await waitForEnteringState(() => this.dbConnectionReady || !!this.dbError, Infinity);
    if(this.dbError){
      this.logger.warn("Database connecting failed!!");
      return null;
    }
    try{
      const dbResult = this.collections.status.find({
        "$or": guildIds.map(id => ({
          guildId: id,
        })),
      });
      const result = new Map<string, exportableStatuses>();
      await dbResult.forEach(doc => {
        result.set(doc.guildId, doc);
      });
      return result;
    }
    catch(er){
      this.logger.error(er);
      this.logger.error("Status restoring failed!");
      return null;
    }
  }

  override async getQueueDataFromBackup(guildids: string[]): Promise<Map<string, YmxFormat>>{
    if(!this.dbConnectionReady && !this.dbError) await waitForEnteringState(() => this.dbConnectionReady || !!this.dbError, Infinity);
    if(this.dbError){
      this.logger.warn("Database connecting failed!!");
      return null;
    }
    try{
      const dbResult = this.collections.queue.find({
        "$or": guildids.map(id => ({
          guildId: id,
        })),
      });
      const result = new Map<string, YmxFormat>();
      await dbResult.forEach(doc => {
        result.set(doc.guildId, doc);
      });
      return result;
    }
    catch(er){
      this.logger.error(er);
      this.logger.error("Queue restoring failed!");
      return null;
    }
  }

  async destroy(){
    await this.client.close();
    this.collections = null;
    this.dbConnectionReady = false;
  }
}
