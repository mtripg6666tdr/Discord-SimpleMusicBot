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

import type { BaseCommand, CommandArgs } from "../../Commands";
import type { GuildDataContainer, YmxFormat } from "../../Structure";
import type { DataType, MusicBotBase } from "../../botBase";
import type { JSONStatuses } from "../../types/GuildStatuses";
import type * as mongo from "mongodb";

import { Backupper } from ".";
import { createDebounceFunctionsFactroy, requireIfAny, waitForEnteringState } from "../../Util";
import { measureTime } from "../../Util/decorators";
import { CommandManager } from "../commandManager";

const MongoClient = (requireIfAny("mongodb") as typeof import("mongodb"))?.MongoClient;

type Collectionate<T> = T & { guildId: string };
type Analytics = Collectionate<{
  totalDuration: number,
  errorCount: number,
  timestamp: number,
  type: "playlog",
}|{
  command: string,
  count: number,
  type: "command",
}>;

export class MongoBackupper extends Backupper {
  private readonly client: mongo.MongoClient = null!;
  private dbConnectionReady = false;
  private dbError: Error | null = null;
  collections: {
    status: mongo.Collection<Collectionate<JSONStatuses>>,
    queue: mongo.Collection<Collectionate<YmxFormat>>,
    analytics: mongo.Collection<Analytics>,
  } = null!;

  static get backuppable() {
    return process.env.DB_URL && (process.env.DB_URL.startsWith("mongodb://") || process.env.DB_URL.startsWith("mongodb+srv://"));
  }

  constructor(bot: MusicBotBase, getData: () => DataType) {
    super(bot, getData);

    this.logger.info("Initializing Mongo DB backup server adapter...");

    // prepare mongodb client
    this.client = new MongoClient(process.env.DB_URL!, {
      appName: `mtripg6666tdr/Discord-SimpleMusicBot#${this.bot.version || "unknown"} MondoDB backup server adapter`,
    });
    this.client.connect()
      .then(() => {
        this.logger.info("Database connection ready");
        const db = this.client.db(process.env.DB_TOKEN || "discord_music_bot_backup");
        this.collections = {
          status: db.collection<Collectionate<JSONStatuses>>("Status"),
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

    // set hook
    this.bot.once("beforeReady", () => {
      const backupStatusFuncFactory = createDebounceFunctionsFactroy(this.backupStatus.bind(this), 5000);
      const backupQueueFuncFactory = createDebounceFunctionsFactroy(this.backupQueue.bind(this), 5000);

      const setContainerEvent = (container: GuildDataContainer) => {
        container.queue.eitherOn(["change", "changeWithoutCurrent"], backupQueueFuncFactory(container.getGuildId()));
        container.queue.on("settingsChanged", backupStatusFuncFactory(container.getGuildId()));
        container.player.on("all", backupStatusFuncFactory(container.getGuildId()));
        container.preferences.on("updateSettings", backupStatusFuncFactory(container.getGuildId()));
        container.player.on("reportPlaybackDuration", this.addPlayerAnalyticsEvent.bind(this, container.getGuildId()));
      };

      this.data.forEach(setContainerEvent);
      this.bot.on("guildDataAdded", setContainerEvent);
      this.bot.on("onBotVoiceChannelJoin", (channel) => backupStatusFuncFactory(channel.guild.id)());
      this.bot.client.on("guildDelete", ({ id }) => this.deleteGuildData(id));

      // analytics
      CommandManager.instance.commands.forEach(command => command.on("run", args => this.addCommandAnalyticsEvent(command, args)));

      this.logger.info("Hook was set up successfully");
    });
  }

  protected async deleteGuildData(guildId: string) {
    if (this.collections && this.dbConnectionReady) {
      Promise.allSettled([
        this.collections.queue.deleteOne({ guildId }),
        this.collections.status.deleteOne({ guildId }),
      ]).catch(this.logger.error);
    } else {
      this.logger.warn(`No data was removed (guildId: ${guildId}) due to no connection`);
    }
  }

  @measureTime
  async backupStatus(guildId: string) {
    if (!MongoBackupper.backuppable || !this.dbConnectionReady) return;
    try {
      this.logger.info(`Backing up status...(${guildId})`);
      const status = this.data.get(guildId)?.exportStatus();
      if (!status) return;
      await this.collections.status.updateOne({ guildId }, {
        "$set": {
          guildId,
          ...status,
        },
      }, {
        upsert: true,
      });
    }
    catch (er) {
      this.logger.error(er);
      this.logger.info("Something went wrong while backing up status");
    }
  }

  @measureTime
  async backupQueue(guildId: string) {
    if (!MongoBackupper.backuppable || !this.dbConnectionReady) return;
    try {
      const queue = this.data.get(guildId)?.exportQueue();
      if (!queue) return;
      this.logger.info(`Backing up queue...(${guildId})`);
      await this.collections.queue.updateOne({ guildId }, {
        "$set": {
          guildId,
          ...queue,
        },
      }, {
        upsert: true,
      });
    }
    catch (er) {
      this.logger.error(er);
      this.logger.warn("Something went wrong while backing up queue");
    }
  }

  async addPlayerAnalyticsEvent(guildId: string, totalDuration: number, errorCount: number) {
    if (!MongoBackupper.backuppable || !this.dbConnectionReady) return;
    try {
      await this.collections.analytics.insertOne({
        type: "playlog",
        guildId,
        totalDuration,
        errorCount,
        timestamp: Date.now(),
      });
    }
    catch (er) {
      this.logger.error(er);
    }
  }

  async addCommandAnalyticsEvent(command: BaseCommand, context: CommandArgs) {
    if (!MongoBackupper.backuppable || !this.dbConnectionReady) return;
    try {
      await this.collections.analytics.updateOne({
        type: "command",
        commandName: command.name,
        guildId: context.server.getGuildId(),
      }, {
        $inc: {
          count: 1,
        },
      }, {
        upsert: true,
      });
    }
    catch (er) {
      this.logger.error(er);
    }
  }

  @measureTime
  override async getStatusFromBackup(guildIds: string[]) {
    if (!this.dbConnectionReady && !this.dbError) await waitForEnteringState(() => this.dbConnectionReady || !!this.dbError, Infinity);
    if (this.dbError) {
      this.logger.warn("Database connecting failed!!");
      return null;
    }
    try {
      const dbResult = this.collections.status.find({
        "$or": guildIds.map(id => ({
          guildId: id,
        })),
      });
      const result = new Map<string, JSONStatuses>();
      for await (const doc of dbResult) {
        result.set(doc.guildId, doc);
      }
      return result;
    }
    catch (er) {
      this.logger.error(er);
      this.logger.error("Status restoring failed!");
      return null;
    }
  }

  @measureTime
  override async getQueueDataFromBackup(guildids: string[]) {
    if (!this.dbConnectionReady && !this.dbError) await waitForEnteringState(() => this.dbConnectionReady || !!this.dbError, Infinity);
    if (this.dbError) {
      this.logger.warn("Database connecting failed!!");
      return null;
    }
    try {
      const dbResult = this.collections.queue.find({
        "$or": guildids.map(id => ({
          guildId: id,
        })),
      });
      const result = new Map<string, YmxFormat>();
      for await (const doc of dbResult) {
        result.set(doc.guildId, doc);
      }
      return result;
    }
    catch (er) {
      this.logger.error(er);
      this.logger.error("Queue restoring failed!");
      return null;
    }
  }

  async destroy() {
    await this.client.close();
    this.collections = null!;
    this.dbConnectionReady = false;
  }
}
