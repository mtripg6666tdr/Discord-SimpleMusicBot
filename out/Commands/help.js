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
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const _1 = require(".");
const AudioSource_1 = require("../AudioSource");
const color_1 = require("../Util/color");
const config_1 = require("../config");
const config = (0, config_1.getConfig)();
class Help extends _1.BaseCommand {
    constructor() {
        super({
            alias: ["help", "support"],
            unlist: false,
            category: "bot",
            requiredPermissionsOr: [],
            shouldDefer: false,
        });
    }
    async run(message, context) {
        const { t } = context;
        const developerId = "593758391395155978";
        const cachedUser = context.client.users.get(developerId);
        const developer = cachedUser
            ? cachedUser.globalName || cachedUser.username
            : await context.client.rest.users.get(developerId)
                .then(user => user.globalName || user.username)
                .catch(() => null);
        const { isDisabledSource } = config;
        const embed = new helper_1.MessageEmbedBuilder()
            .setTitle(context.client.user.username + ":notes:")
            .setDescription(t("commands:help.embedDescription") + ":robot:"
            + "\r\n"
            + t("commands:help.toLearnMore", { command: `\`${config.noMessageContent ? "/" : context.server.prefix}command\`` }))
            .addField(t("commands:help.developer"), `[${developer || "mtripg6666tdr"}](https://github.com/mtripg6666tdr)`)
            .addField(t("commands:help.version"), `\`${context.bot.version}\``);
        if (!process.env.HIDE_REPO_URL) {
            embed.addField(`${t("commands:help.repository")}/${t("commands:help.sourceCode")}`, "https://github.com/mtripg6666tdr/Discord-SimpleMusicBot");
        }
        if (!process.env.HIDE_SUPPORT_SERVER_URL) {
            embed.addField(t("commands:help.supportServer"), process.env.SUPPORT_SERVER_URL || "https://discord.gg/7DrAEXBMHe");
        }
        embed
            .addField(t("commands:help.availableSources"), [
            !isDisabledSource("youtube") && `・YouTube(${t("commands:help.keywordSearch")})`,
            !isDisabledSource("youtube") && `・YouTube(${t("commands:help.videoUrl")})`,
            !isDisabledSource("youtube") && `・YouTube(${t("commands:help.playlistUrl")})`,
            !isDisabledSource("soundcloud") && `・SoundCloud(${t("commands:help.keywordSearch")})`,
            !isDisabledSource("soundcloud") && `・SoundCloud(${t("commands:help.musicPageUrl")})`,
            !isDisabledSource("streamable") && `・Streamable(${t("commands:help.videoUrl")})`,
            !isDisabledSource("custom") && `・Discord(${t("commands:help.discordAttachmentUrl")})`,
            !isDisabledSource("googledrive") && `・${t("commands:help.googleDrive")}(${t("commands:help.driveShareUrl")})`,
            !isDisabledSource("niconico") && `・${t("commands:help.niconico")}(${t("commands:help.videoUrl")})`,
            !isDisabledSource("niconico") && `・${t("commands:help.niconico")}(${t("commands:help.keywordSearch")})`,
            !isDisabledSource("twitter") && `・Twitter(${t("commands:help.tweetUrl")})`,
            !isDisabledSource("spotify") && AudioSource_1.Spotify.available && `・Spotify(${t("commands:help.spotify")})`,
            !isDisabledSource("custom") && `・${t("commands:help.custom")}`,
        ].filter(d => d).join("\r\n"))
            .setColor((0, color_1.getColor)("HELP"));
        await message.reply({ embeds: [embed.toOceanic()] }).catch(this.logger.error);
    }
}
exports.default = Help;
//# sourceMappingURL=help.js.map