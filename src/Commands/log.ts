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

import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/commandResolver/CommandMessage";
import type { EmbedOptions } from "oceanic.js";

import * as os from "os";
import path from "path";

import { MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import * as Util from "../Util";
import { getColor } from "../Util/color";
import { getMBytes } from "../Util/system";
import { getConfig } from "../config";
import { getLogs } from "../logger";

const config = getConfig();

export default class SystemInfo extends BaseCommand {
  constructor() {
    super({
      alias: ["ログ", "log", "systeminfo", "sysinfo"],
      unlist: false,
      category: "utility",
      args: [{
        type: "string",
        name: "content",
        required: false,
        choices: [
          "basic",
          "mem",
          "cpu",
          "log",
        ],
      }],
      requiredPermissionsOr: [],
      shouldDefer: false,
      examples: true,
      usage: true,
    });
  }

  getPackageVersion(mod: string): string {
    try {
      return require(`${mod}/package.json`).version;
    }
    catch {/* empty */}

    try {
      let packageRootPath = require.resolve(mod);
      const fsModSuffix = mod.replace(/\//g, path.sep);

      for (let i = 0; i < 5; i++) {
        packageRootPath = path.join(packageRootPath, "..");

        if (packageRootPath.endsWith(fsModSuffix)) {
          break;
        }
      }

      return require(path.join(packageRootPath, "package.json")).version;
    }
    catch {/* empty */}

    return "unknown";
  }

  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;
    // Run default logger
    context.bot.logGeneralInfo();
    await message.reply(t("commands:log.executing"));

    const embeds = [] as EmbedOptions[];

    if (context.args.includes("basic") || context.args.length === 0) {
      const cacheState = context.bot.cache.getMemoryCacheState();
      embeds.push(
        new MessageEmbedBuilder()
          .setTitle("Discord-SimpleMusicBot")
          .setDescription("Basic Info")
          .addField(t("commands:log.version"), `\`${context.bot.version}\``, true)
          .addField(t("commands:log.managedCollectorsID"), `\`${context.bot.collectors.customIdLength}\``, true)
          .addField(t("commands:log.managedCollectors"), `\`${context.bot.collectors.collectorLength}\``, true)
          .addField(t("commands:log.totalCost"), `\`${context.bot.totalTransformingCost}\``, true)
          .addField(t("commands:log.memCacheTotal"), `\`${cacheState.totalCount}\``, true)
          .addField(t("commands:log.memCacheGarbage"), `\`${cacheState.purgeScheduled}\``, true)
          .addField(
            t("commands:log.persistentCache"),
            `\`${
              await context.bot.cache.getPersistentCacheSize()
                .then(size => getMBytes(size))
                .catch(() => "unknown")
            }MB\``,
            true
          )
          .addField(
            t("commands:log.modules"),
            [
              "oceanic.js",
              "@mtripg6666tdr/oceanic-command-resolver",
              "@discordjs/voice",
              "prism-media",
              "@discordjs/opus",
              "opusscript",
              "zlib-sync",
              "pako",
            ]
              .map(mod => `\`${mod}\`@${this.getPackageVersion(mod)}`)
              .join("\r\n")
          )
          .setColor(getColor("UPTIME"))
          .toOceanic()
      );
    }

    if (config.isBotAdmin(message.member.id) && (context.args.includes("log") || context.args.length === 0)) {
      let logs: string[] = [...getLogs()];
      logs.reverse();
      for (let i = 0; i < logs.length; i++) {
        if (logs.join("\r\n").length < 3950) break;
        logs = logs.slice(0, -1);
      }
      logs.reverse();
      // Process Logs
      embeds.push(
        new MessageEmbedBuilder()
          .setColor(getColor("UPTIME"))
          .setTitle("Log")
          .setDescription(`Last ${logs.length}bot logs\r\n\`\`\`\r\n${logs.join("\r\n")}\r\n\`\`\``)
          .toOceanic()
      );
    }

    if (config.isBotAdmin(message.member.id) && context.args.includes("servers") || context.args.length === 0) {
      embeds.push(
        new MessageEmbedBuilder()
          .setColor(getColor("UPTIME"))
          .setTitle("Server Info")
          .setDescription(
            `**${t("commands:log.guildName")}(NSFW LEVEL,ID)**\r\n`
            + context.client.guilds.map(guild => `${guild.name.length > 17 ? guild.name.substring(0, 17) + "…" : guild.name} (${guild.nsfwLevel},${guild.id})`).join("\r\n")
          )
          .addField(t("commands:log.participatingGuildCount"), context.bot.client.guilds.size.toString(), true)
          .addField(t("commands:log.registeredGuildCount"), context.bot.databaseCount.toString(), true)
          .addField(t("commands:log.connectingGuildCount"), context.bot.connectingGuildCount.toString(), true)
          .addField(t("commands:log.playingGuildCount"), context.bot.playingGuildCount.toString(), true)
          .addField(t("commands:log.pausedGuildCount"), context.bot.pausedGuildCount.toString(), true)
          .toOceanic()
      );
    }

    if (config.isBotAdmin(message.member.id) && (context.args[0] === "server" && context.args[1] && context.client.guilds.has(context.args[1]))) {
      const target = context.client.guilds.get(context.args[1])!;
      const data = context.bot.getData(context.args[1]);
      embeds.push(
        new MessageEmbedBuilder()
          .setColor(getColor("HELP"))
          .setTitle(t("commands:log.guildSearchResult"))
          .addField(t("commands:log.guildName"), target.name, true)
          .addField(t("commands:log.guildId"), target.id, true)
          .addField(t("commands:log.guildIcon"), target.icon || t("none"), true)
          .addField(t("commands:log.guildChannelCountFromCache"), target.channels.size.toString(), true)
          .addField(t("commands:log.memberCount"), target.memberCount?.toString() || target.approximateMemberCount?.toString() || t("unknown"), true)
          .addField(t("commands:log.guildConnecting"), data?.player.isConnecting ? t("yes") : t("no"), true)
          .addField(t("commands:log.guildPlaying"), data?.player.isPlaying ? t("yes") : t("no"), true)
          .addField(t("commands:log.guildPaused"), data?.player.isPaused ? t("yes") : t("no"), true)
          .addField(t("commands:log.itemsInQueue"), data?.queue.length.toString() || "0", true)
          .addField(t("commands:log.currentTransformingCost"), data?.player.cost.toString() || "0", true)
          .addField(
            t("commands:log.liveStream"),
            data?.player.currentAudioInfo?.isYouTube() && data?.player.currentAudioInfo.isLiveStream ? t("yes") : t("no"),
            true
          )
          .setThumbnail(target.iconURL()!)
          .toOceanic()
      );
    }

    if (context.args.includes("cpu") || context.args.length === 0) {
      // Process CPU Info
      const cpuInfoEmbed = new MessageEmbedBuilder();
      cpuInfoEmbed.setColor(getColor("UPTIME")).setTitle("CPU Info");
      const cpus = os.cpus();
      for (let i = 0; i < cpus.length; i++) {
        const all = cpus[i].times.user + cpus[i].times.sys + cpus[i].times.nice + cpus[i].times.irq + cpus[i].times.idle;
        cpuInfoEmbed.addField(
          "CPU" + (i + 1),
          [
            `Model: \`${cpus[i].model}\``,
            `Speed: \`${cpus[i].speed}MHz\``,
            `Times(user): \`${Math.round(cpus[i].times.user / 1000)}s(${Util.getPercentage(cpus[i].times.user, all)}%)\``,
            `Times(sys): \`${Math.round(cpus[i].times.sys / 1000)}s(${Util.getPercentage(cpus[i].times.sys, all)}%)\``,
            `Times(nice): \`${Math.round(cpus[i].times.nice / 1000)}s(${Util.getPercentage(cpus[i].times.nice, all)}%)\``,
            `Times(irq): \`${Math.round(cpus[i].times.irq / 1000)}s(${Util.getPercentage(cpus[i].times.irq, all)}%)\``,
            `Times(idle): \`${Math.round(cpus[i].times.idle / 1000)}s(${Util.getPercentage(cpus[i].times.idle, all)}%)\``,
          ].join("\r\n"),
          true
        );
      }
      embeds.push(cpuInfoEmbed.toOceanic());
    }

    if (context.args.includes("mem") || context.args.length === 0) {
      // Process Mem Info
      const memory = Util.system.getMemoryInfo();
      const nMem = process.memoryUsage();
      const rss = Util.system.getMBytes(nMem.rss);
      const ext = Util.system.getMBytes(nMem.external);
      embeds.push(
        new MessageEmbedBuilder()
          .setColor(getColor("UPTIME"))
          .setTitle("Memory Info")
          .addField("Total Memory",
            "Total: `" + memory.total + "MB`\r\n"
            + "Used: `" + memory.used + "MB`\r\n"
            + "Free: `" + memory.free + "MB`\r\n"
            + "Usage: `" + memory.usage + "%`",
            true
          )
          .addField("Main Process Memory",
            "RSS: `" + rss + "MB`\r\n"
            + "Heap total: `" + Util.system.getMBytes(nMem.heapTotal) + "MB`\r\n"
            + "Heap used: `" + Util.system.getMBytes(nMem.heapUsed) + "MB`\r\n"
            + "Array buffers: `" + Util.system.getMBytes(nMem.arrayBuffers) + "MB`\r\n"
            + "External: `" + ext + "MB`\r\n"
            + "Total: `" + Util.getPercentage(rss + ext, memory.total) + "%`",
            true
          )
          .toOceanic()
      );
    }

    if (embeds.length > 0) {
      await message.channel.createMessage({ embeds }).catch(this.logger.error);
    }
    if (embeds.length === 0) {
      await message.channel.createMessage({ content: t("commands:log.incorrectArgument") }).catch(this.logger.error);
    }
  }
}
