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

import candyget from "candyget";

import { IntervalBackupper } from ".";
import { measureTime } from "../../Util/decorators";

const MIME_JSON = "application/json";

export class HttpBackupper extends IntervalBackupper {
  protected userAgent: string;

  constructor(bot: MusicBotBase, getData: () => DataType) {
    super(bot, getData, "HttpBased");

    this.userAgent = `mtripg6666tdr/Discord-SimpleMusicBot#${this.bot.version || "unknown"} http based backup server adapter`;
  }

  static get backuppable() {
    return !!(process.env.DB_TOKEN && process.env.DB_URL);
  }

  /**
   * 接続ステータス等をバックアップします
   */
  @measureTime
  protected override async backupStatus() {
    try {
      const statusModifiedGuildIds = this.getStatusModifiedGuildIds();

      if (statusModifiedGuildIds.length <= 0) {
        this.logger.debug("No modified status found, skipping");
        return;
      }

      this.logger.info("Backing up modified status...");

      const statuses: { [guildId: string]: string } = {};
      const originalStatuses: { [guildId: string]: JSONStatuses } = {};
      statusModifiedGuildIds.forEach(id => {
        const status = this.data.get(id)?.exportStatus();
        if (!status) return;

        statuses[id] = [
          status.voiceChannelId,
          status.boundChannelId,
          status.loopEnabled ? "1" : "0",
          status.queueLoopEnabled ? "1" : "0",
          status.addRelatedSongs ? "1" : "0",
          status.equallyPlayback ? "1" : "0",
          status.volume,
          status.disableSkipSession,
          status.nowPlayingNotificationLevel,
        ].join(":");
        originalStatuses[id] = status;
      });

      const payload = {
        token: process.env.DB_TOKEN,
        type: "j",
        guildid: statusModifiedGuildIds.join(","),
        data: JSON.stringify(statuses),
      };

      await candyget.post(process.env.DB_URL!, "json", {
        headers: {
          "Content-Type": MIME_JSON,
          "User-Agent": this.userAgent,
        },
        validator: this.postResultValidator.bind(this),
      }, payload);

      statusModifiedGuildIds.forEach(id => this.updateStatusCache(id, originalStatuses[id]));
    }
    catch (e) {
      this.logger.warn(e);
    }
  }

  /**
   * キューをバックアップします
   */
  @measureTime
  protected override async backupQueue() {
    try {
      const modifiedGuildIds = this.getQueueModifiedGuildIds();

      if (modifiedGuildIds.length <= 0) {
        this.logger.debug("No modified queue found, skipping");
        return;
      }

      this.logger.info("Backing up modified queue...");

      const queues: { [guildId: string]: string } = {};
      modifiedGuildIds.forEach(id => {
        const guild = this.data.get(id);
        if (!guild) return;
        queues[id] = encodeURIComponent(JSON.stringify(guild.exportQueue()));
      });

      const payload = {
        token: process.env.DB_TOKEN,
        guildid: modifiedGuildIds.join(","),
        data: JSON.stringify(queues),
        type: "queue",
      };

      const { body } = await candyget.post<postResult>(process.env.DB_URL!, "json", {
        headers: {
          "Content-Type": MIME_JSON,
          "User-Aegnt": this.userAgent,
        },
        validator: this.postResultValidator.bind(this),
      }, payload);

      if (body.status === 200) {
        this.unmarkAllQueueModifiedGuild();
      } else {
        throw new Error(`Status code: ${body.status}`);
      }
    }
    catch (e) {
      this.logger.error(e);
      this.logger.info("Something went wrong while backing up queue");
    }
  }

  @measureTime
  override async getStatusFromBackup(guildids: string[]) {
    if (HttpBackupper.backuppable) {
      try {
        const { body: result } = await candyget.json<getResult>(
          `${process.env.DB_URL}?token=${encodeURIComponent(process.env.DB_TOKEN!)}&guildid=${guildids.join(",")}&type=j`,
          {
            headers: {
              "User-Agent": this.userAgent,
            },
            validator: this.getResultValidator.bind(this),
          }
        );
        if (result.status === 200) {
          const frozenGuildStatuses = result.data;
          const map = new Map<string, JSONStatuses>();
          Object.keys(frozenGuildStatuses).forEach(key => {
            const [
              voiceChannelId,
              boundChannelId,
              loopEnabled,
              queueLoopEnabled,
              addRelatedSongs,
              equallyPlayback,
              volume,
              disableSkipSession,
              nowPlayingNotificationLevel,
            ] = frozenGuildStatuses[key].split(":");
            const numVolume = Number(volume) || 100;
            const b = (v: string) => v === "1";
            map.set(key, {
              voiceChannelId,
              boundChannelId,
              loopEnabled: b(loopEnabled),
              queueLoopEnabled: b(queueLoopEnabled),
              addRelatedSongs: b(addRelatedSongs),
              equallyPlayback: b(equallyPlayback),
              volume: numVolume >= 1 && numVolume <= 200 ? numVolume : 100,
              disableSkipSession: b(disableSkipSession),
              nowPlayingNotificationLevel: Number(nowPlayingNotificationLevel) || 0,
            });
          });
          return map;
        } else {
          return null;
        }
      }
      catch (er) {
        this.logger.error(er);
        this.logger.warn("Status restoring failed!");
        return null;
      }
    } else {
      return null;
    }
  }

  @measureTime
  override async getQueueDataFromBackup(guildids: string[]) {
    if (HttpBackupper.backuppable) {
      try {
        const { body: result } = await candyget.json<getResult>(
          `${process.env.DB_URL}?token=${encodeURIComponent(process.env.DB_TOKEN!)}&guildid=${guildids.join(",")}&type=queue`,
          {
            headers: {
              "User-Agent": this.userAgent,
            },
            validator: this.getResultValidator.bind(this),
          }
        );
        if (result.status === 200) {
          const frozenQueues = result.data as { [guildid: string]: string };
          const res = new Map<string, YmxFormat>();
          Object.keys(frozenQueues).forEach(key => {
            try {
              const ymx = JSON.parse<YmxFormat>(decodeURIComponent(frozenQueues[key]));
              res.set(key, ymx);
            }
            catch { /* empty */ }
          });
          return res;
        } else {
          return null;
        }
      }
      catch (er) {
        this.logger.error(er);
        this.logger.warn("Queue restoring failed!");
        return null;
      }
    } else {
      return null;
    }
  }

  protected postResultValidator(data: any): data is postResult {
    return data && typeof data === "object" && typeof data.status === "number";
  }

  protected getResultValidator(data: any): data is getResult {
    return this.postResultValidator(data) && "data" in data && typeof data.data === "object";
  }

  override destroy() {
    /* empty */
  }
}

type postResult = {
  status: 200|404,
};

type getResult = postResult & {
  data: { [guildId: string]: string },
};
