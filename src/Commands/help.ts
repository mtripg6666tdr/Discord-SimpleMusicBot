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
import type { CommandMessage } from "../Component/commandResolver/CommandMessage";
import type { i18n } from "i18next";

import { MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { BaseCommand } from ".";
import { Spotify } from "../AudioSource";
import { getColor } from "../Util/color";
import { useConfig } from "../config";

const config = useConfig();

export default class Help extends BaseCommand {
  constructor(){
    super({
      alias: ["help", "support"],
      unlist: false,
      category: "bot",
      requiredPermissionsOr: [],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, context: CommandArgs, t: i18n["t"]){
    const developerId = "593758391395155978";
    const cachedUser = context.client.users.get(developerId);
    const developer = cachedUser
      ? cachedUser.username
      : await context.client.rest.users.get(developerId)
        .then(user => user.username)
        .catch(() => null as string)
      ;
    const { isDisabledSource } = config;
    const embed = new MessageEmbedBuilder()
      .setTitle(context.client.user.username + ":notes:")
      .setDescription(
        t("commands:help.embedDescription")
        + "\r\n"
        + t("commands:help.toLearnMore", { command: `\`${config.noMessageContent ? "/" : context.server.prefix}command\`` }))
      .addField(t("commands:help.developer"), `[${developer || "mtripg6666tdr"}](https://github.com/mtripg6666tdr)`)
      .addField(t("commands:help.version"), `\`${context.bot.version}\``)
      .addField(
        `${t("commands:help.repository")}/${t("commands:help.sourceCode")}`,
        "https://github.com/mtripg6666tdr/Discord-SimpleMusicBot"
      )
      .addField(t("commands:help.supportServer"), "https://discord.gg/7DrAEXBMHe")
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
        !isDisabledSource("twitter") && `・Twitter(${t("commands:help.tweetUrl")})`,
        !isDisabledSource("spotify") && Spotify.available && `・Spotify(${t("commands:help.spotify")})`,
        !isDisabledSource("custom") && `・${t("commands:help.custom")}`,
      ].filter(d => d).join("\r\n"))
      .setColor(getColor("HELP"))
      .toOceanic()
    ;
    await message.reply({ embeds: [embed] }).catch(this.logger.error);
  }
}
