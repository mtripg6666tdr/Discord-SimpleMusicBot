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
exports.handleButtonInteraction = handleButtonInteraction;
const commandManager_1 = require("../Component/commandManager");
const CommandMessage_1 = require("../Component/commandResolver/CommandMessage");
async function handleButtonInteraction(server, interaction) {
    this.logger.info("received button interaction");
    // コレクターで処理できるか？
    if (await this.collectors.onInteractionCreate(interaction)) {
        return;
    }
    if (interaction.data.customID.startsWith("control_")) {
        let command = null;
        switch (interaction.data.customID) {
            case "control_rewind":
                command = "rewind";
                break;
            case "control_playpause":
                command = server.player.isPaused ? "play" : "pause";
                break;
            case "control_skip":
                command = "skip";
                break;
            case "control_onceloop":
                command = "onceloop";
                break;
            default:
                return;
        }
        const commandMessage = CommandMessage_1.CommandMessage.createFromInteraction(interaction, command, [], "");
        const args = this["createCommandRunnerArgs"](commandMessage.guild.id, commandMessage.options, commandMessage.rawOptions, interaction.locale);
        args.includeMention = true;
        commandManager_1.CommandManager.instance
            .resolve(command)
            ?.checkAndRun(commandMessage, args)
            .catch(this.logger.error);
    }
}
//# sourceMappingURL=buttonInteraction.js.map