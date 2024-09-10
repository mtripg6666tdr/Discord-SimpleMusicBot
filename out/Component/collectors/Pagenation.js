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
exports.Pagenation = void 0;
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const helper_2 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const InteractionCollector_1 = require("./InteractionCollector");
const arrowRightEmoji = "▶";
const arrowLeftEmoji = "◀";
class Pagenation extends InteractionCollector_1.InteractionCollector {
    constructor() {
        super(...arguments);
        this._embedsResolvable = null;
        this._embeds = null;
        this._arrowLeftCustomId = null;
        this._arrowRightCustomId = null;
    }
    setPages(embeds, total) {
        this._embedsResolvable = embeds;
        this._totalPage = total;
        this._embeds = Array.from({ length: total });
        return this;
    }
    async send(message, initialPage = 0) {
        if (!this._embeds || !this._embedsResolvable) {
            throw new Error("server or embeds not set");
        }
        const { customIdMap } = this
            .setMaxInteraction(Infinity)
            .setResetTimeoutOnInteraction(true)
            .setTimeout(5 * 60 * 1000)
            .createCustomIds({
            arrowLeft: "button",
            arrowRight: "button",
        });
        this._arrowLeftCustomId = customIdMap.arrowLeft;
        this._arrowRightCustomId = customIdMap.arrowRight;
        this._currentPage = initialPage;
        const firstEmbed = await this.resolvePageEmbed(this._currentPage);
        if (!firstEmbed)
            throw new Error("Initlal page was invalid.");
        this.setMessage(await message.reply({
            content: "",
            embeds: [firstEmbed],
            components: [
                this.createMessageComponents(this._currentPage),
            ],
        }));
        this.on("arrowLeft", interaction => this.edit(--this._currentPage, interaction));
        this.on("arrowRight", interaction => this.edit(++this._currentPage, interaction));
        return this;
    }
    async edit(page, interaction) {
        const embed = await this.resolvePageEmbed(page);
        if (!embed)
            return;
        this._currentPage = page;
        const messageContent = {
            content: "",
            embeds: [embed],
            components: [
                this.createMessageComponents(page),
            ],
        };
        if (interaction) {
            this.setMessage(await interaction.editOriginal(messageContent));
        }
        else if (this.message) {
            await this.message.edit(messageContent);
        }
        else {
            throw new Error("The message has not been sent yet.");
        }
    }
    resolvePageEmbed(page) {
        if (!this._embeds || !this._embedsResolvable) {
            throw new Error("server or embeds not set");
        }
        if (page < 0 || page >= this._totalPage) {
            return null;
        }
        else if (this._embeds[page]) {
            return this._embeds[page];
        }
        else if (Array.isArray(this._embedsResolvable)) {
            const embed = this._embedsResolvable[page];
            if (embed instanceof helper_1.MessageEmbedBuilder) {
                return this._embeds[page] = embed.toOceanic();
            }
            else {
                return this._embeds[page] = embed;
            }
        }
        else {
            const res = this._embedsResolvable(page);
            if (res instanceof Promise) {
                return res.then(embed => this._embeds[page] = embed);
            }
            else {
                return this._embeds[page] = this._embedsResolvable(page);
            }
        }
    }
    createMessageComponents(page) {
        if (!this._arrowLeftCustomId || !this._arrowRightCustomId) {
            throw new Error("Message has not been sent yet.");
        }
        return (new helper_2.MessageActionRowBuilder()
            .addComponents(new helper_2.MessageButtonBuilder()
            .setCustomId(this._arrowLeftCustomId)
            .setDisabled(page === 0)
            .setEmoji(arrowLeftEmoji)
            .setStyle("PRIMARY"), new helper_2.MessageButtonBuilder()
            .setCustomId(this._arrowRightCustomId)
            .setDisabled(page + 1 === this._totalPage)
            .setEmoji(arrowRightEmoji)
            .setStyle("PRIMARY"))
            .toOceanic());
    }
}
exports.Pagenation = Pagenation;
//# sourceMappingURL=Pagenation.js.map