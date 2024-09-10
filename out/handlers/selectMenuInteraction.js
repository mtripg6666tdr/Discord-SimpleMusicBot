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
exports.handleSelectMenuInteraction = handleSelectMenuInteraction;
async function handleSelectMenuInteraction(server, interaction) {
    if (!interaction.inCachedGuildChannel())
        return;
    this.logger.info("received selectmenu interaction");
    if (await this.collectors.onInteractionCreate(interaction)) {
        return;
    }
    // 検索パネル取得
    const panel = this.guildData.get(interaction.channel.guild.id)?.searchPanel.get(interaction.member.id);
    // なければ返却
    if (!panel)
        return;
    await interaction.deferUpdate();
    if (interaction.data.customID === "search") {
        if (interaction.data.values.getStrings().includes("cancel")) {
            await panel.destroy();
        }
        else {
            await server.playFromSearchPanelOptions(interaction.data.values.getStrings(), panel);
        }
    }
}
//# sourceMappingURL=selectMenuInteraction.js.map