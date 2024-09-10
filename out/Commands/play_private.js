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
const oceanic_js_1 = require("oceanic.js");
const _1 = require(".");
const CommandMessage_1 = require("../Component/commandResolver/CommandMessage");
class PlayPrivate extends _1.BaseCommand {
    constructor() {
        super({
            unlist: false,
            alias: ["play_private"],
            category: "player",
            requiredPermissionsOr: [],
            shouldDefer: false,
            interactionOnly: true,
            defaultMemberPermission: [],
        });
    }
    async run(message, context) {
        const { t } = context;
        if (message["isMessage"] || !message["_interaction"]) {
            await message.reply(`:x: ${t("commands:play_private.noInteraction")}`).catch(this.logger.error);
            return;
        }
        const interaction = message["_interaction"];
        if (interaction.type !== oceanic_js_1.InteractionTypes.APPLICATION_COMMAND)
            return;
        await interaction.createModal({
            title: t("commands:play_private.modalTitle"),
            customID: "play_private",
            components: [
                {
                    type: oceanic_js_1.ComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: oceanic_js_1.ComponentTypes.TEXT_INPUT,
                            label: t("commands:play_private.inputLabel"),
                            required: true,
                            placeholder: "https://",
                            style: oceanic_js_1.TextInputStyles.SHORT,
                            customID: "url",
                        },
                    ],
                },
            ],
        }).catch(this.logger.error);
    }
    async handleModalSubmitInteraction(interaction, server) {
        const value = interaction.data.components.getTextInput("url");
        if (value) {
            const message = CommandMessage_1.CommandMessage.createFromInteraction(interaction, "play_private", [value], value);
            const items = await server.playFromUrl(message, value, { privateSource: true });
            if (items.length <= 0 || !await server.joinVoiceChannel(message, {})) {
                return;
            }
            await server.player.play({ bgm: false });
        }
    }
}
exports.default = PlayPrivate;
//# sourceMappingURL=play_private.js.map