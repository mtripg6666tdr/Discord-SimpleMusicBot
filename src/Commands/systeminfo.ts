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

import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";
import type { EmbedOptions } from "oceanic.js";

import { MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import * as os from "os";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class SystemInfo extends BaseCommand {
  constructor(){
    super({
      name: "システム情報",
      alias: ["ログ", "log", "systeminfo", "sysinfo"],
      description: "ホストされているサーバーやプロセスに関する技術的な情報を表示します。引数(`mem`、`cpu`、`basic`のうちいずれか)を指定して特定の内容のみ取得することもできます。",
      unlist: false,
      category: "utility",
      examples: "sysinfo mem",
      usage: "sysinfo [mem|cpu]",
      argument: [{
        type: "string",
        name: "content",
        description: "basic,mem,cpuのどれかを指定できます",
        required: false,
        choices: {
          "基本情報": "basic",
          "メモリ": "mem",
          "CPU": "cpu",
          "ログ(管理者のみ)": "log",
        },
      }],
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, options: CommandArgs){
    options.server.updateBoundChannel(message);
    // Run default logger
    options.bot.logGeneralInfo();
    await message.reply("実行します");

    const embeds = [] as EmbedOptions[];

    if(options.args.includes("basic") || options.args.length === 0){
      embeds.push(
        new MessageEmbedBuilder()
          .setTitle("Discord-SimpleMusicBot")
          .setDescription("Basic info")
          .addField("Version", `\`${options.bot.version}\``, true)
          .addField("Managed embed toggles", `\`${options.embedPageToggle.length}\``, true)
          .addField("Current total transforming costs", `\`${options.bot.totalTransformingCost}\``)
          .addField("Modules", [
            "oceanic.js",
            "@mtripg6666tdr/oceanic-command-resolver",
            "@discordjs/voice",
            "prism-media",
            "@discordjs/opus",
            "opusscript",
            "zlib-sync",
            "pako",
          ]
            .map(mod => {
              try{
                return `\`${mod}\`@v${require(`../../node_modules/${mod}/package.json`).version}`;
              }
              catch{
                return `\`${mod}\`@unknown`;
              }
            })
            .join("\r\n")
          )
          .setColor(getColor("UPTIME"))
          .toOceanic()
      );
    }

    if(Util.general.isBotAdmin(message.member.id) && (options.args.includes("log") || options.args.length === 0)){
      let logs: string[] = [...Util.logger.logStore.data];
      logs.reverse();
      for(let i = 0; i < logs.length; i++){
        if(logs.join("\r\n").length < 1950) break;
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

    if(Util.general.isBotAdmin(message.member.id) && (options.args.includes("servers") || options.args.length === 0)){
      embeds.push(
        new MessageEmbedBuilder()
          .setColor(getColor("UPTIME"))
          .setTitle("Server Info")
          .setDescription(
            "サーバー名(NSFW LEVEL,ID)\r\n"
            + options.client.guilds.map(guild => `${guild.name.length > 17 ? guild.name.substring(0, 17) + "…" : guild.name} (${guild.nsfwLevel},${guild.id})`).join("\r\n")
          )
          .addField("参加サーバー数", options.bot.client.guilds.size.toString(), true)
          .addField("データが保持されているサーバー数", options.bot.databaseCount.toString(), true)
          .addField("接続中サーバー数", options.bot.connectingGuildCount.toString(), true)
          .addField("再生中サーバー数(一時停止含む)", options.bot.playingGuildCount.toString(), true)
          .addField("一時停止サーバー数", options.bot.pausedGuildCount.toString(), true)
          .toOceanic()
      );
    }

    if(Util.general.isBotAdmin(message.member.id) && (options.args[0] === "server" && options.args[1] && options.client.guilds.has(options.args[1]))){
      const target = options.client.guilds.get(options.args[1]);
      const data = options.bot.getData(options.args[1]);
      embeds.push(
        new MessageEmbedBuilder()
          .setColor(getColor("HELP"))
          .setTitle("(秘)サーバー照会結果")
          .addField("サーバー名", target.name, true)
          .addField("サーバーID", target.id)
          .addField("サーバーアイコン", target.icon || "なし")
          .addField("チャンネル数(キャッシュによる)", target.channels.size.toString(), true)
          .addField("メンバー数(概算)", target.approximateMemberCount?.toString() || "不明", true)
          .addField("接続中", data?.player.isConnecting ? "はい" : "いいえ", true)
          .addField("再生/一時停止中", data?.player.isPaused ? "はい" : "いいえ", true)
          .addField("一時停止中", data?.player.isPaused ? "はい" : "いいえ", true)
          .addField("キュー内のアイテム数", data?.queue.length.toString() || "0", true)
          .addField("現在の変換コスト", data?.player.cost.toString() || "0", true)
          .addField(
            "ライブストリーム",
            data?.player.currentAudioInfo?.isYouTube() && data?.player.currentAudioInfo.isLiveStream ? "はい" : "いいえ",
            true
          )
          .toOceanic()
      );
    }

    if(options.args.includes("cpu") || options.args.length === 0){
      // Process CPU Info
      const cpuInfoEmbed = new MessageEmbedBuilder();
      cpuInfoEmbed.setColor(getColor("UPTIME")).setTitle("CPU Info");
      const cpus = os.cpus();
      for(let i = 0; i < cpus.length; i++){
        const all = cpus[i].times.user + cpus[i].times.sys + cpus[i].times.nice + cpus[i].times.irq + cpus[i].times.idle;
        cpuInfoEmbed.addField(
          "CPU" + (i + 1), "Model: `" + cpus[i].model + "`\r\n"
        + "Speed: `" + cpus[i].speed + "MHz`\r\n"
        + "Times(user): `" + Math.round(cpus[i].times.user / 1000) + "s(" + Util.math.GetPercentage(cpus[i].times.user, all) + "%)`\r\n"
        + "Times(sys): `" + Math.round(cpus[i].times.sys / 1000) + "s(" + Util.math.GetPercentage(cpus[i].times.sys, all) + "%)`\r\n"
        + "Times(nice): `" + Math.round(cpus[i].times.nice / 1000) + "s(" + Util.math.GetPercentage(cpus[i].times.nice, all) + "%)`\r\n"
        + "Times(irq): `" + Math.round(cpus[i].times.irq / 1000) + "s(" + Util.math.GetPercentage(cpus[i].times.irq, all) + "%)`\r\n"
        + "Times(idle): `" + Math.round(cpus[i].times.idle / 1000) + "s(" + Util.math.GetPercentage(cpus[i].times.idle, all) + "%)`"
          , true);
      }
      embeds.push(cpuInfoEmbed.toOceanic());
    }

    if(options.args.includes("mem") || options.args.length === 0){
      // Process Mem Info
      const memory = Util.system.GetMemInfo();
      const nMem = process.memoryUsage();
      const rss = Util.system.GetMBytes(nMem.rss);
      const ext = Util.system.GetMBytes(nMem.external);
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
            + "Heap total: `" + Util.system.GetMBytes(nMem.heapTotal) + "MB`\r\n"
            + "Heap used: `" + Util.system.GetMBytes(nMem.heapUsed) + "MB`\r\n"
            + "Array buffers: `" + Util.system.GetMBytes(nMem.arrayBuffers) + "MB`\r\n"
            + "External: `" + ext + "MB`\r\n"
            + "Total: `" + Util.math.GetPercentage(rss + ext, memory.total) + "%`",
            true
          )
          .toOceanic()
      );
    }
    
    if(embeds.length > 0){
      await message.channel.createMessage({ embeds }).catch(e => Util.logger.log(e, "error"));
    }
  }
}
