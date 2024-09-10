"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const voice_1 = require("@discordjs/voice");
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const _1 = require(".");
const color_1 = require("../Util/color");
class Uptime extends _1.BaseCommand {
    constructor() {
        super({
            alias: ["ping", "latency"],
            unlist: false,
            category: "utility",
            requiredPermissionsOr: [],
            shouldDefer: false,
        });
    }
    async run(message, context) {
        const { t } = context;
        const now = Date.now();
        const embed = new helper_1.MessageEmbedBuilder()
            .setColor((0, color_1.getColor)("UPTIME"))
            .setTitle(t("commands:ping.pingInfo"))
            .addField(t("commands:ping.botMessageReceive"), `${now - message.createdTimestamp.getTime()}ms`)
            .addField(t("commands:ping.botWebSocketConnection"), `${message.guild.shard.latency === Infinity ? "-" : message.guild.shard.latency}ms`)
            .addField(t("commands:ping.voiceWsConnection"), `${(0, voice_1.getVoiceConnection)(context.server.getGuildId())?.ping.ws || "-"}ms`)
            .setTimestamp(Date.now())
            .setAuthor({
            iconURL: context.client.user.avatarURL(),
            name: context.client.user.username,
        })
            .toOceanic();
        message.reply({ embeds: [embed] }).catch(this.logger.error);
    }
}
exports.default = Uptime;
//# sourceMappingURL=ping.js.map