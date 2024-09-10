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
exports.SkipSession = void 0;
const tslib_1 = require("tslib");
const async_lock_1 = require("@mtripg6666tdr/async-lock");
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const i18next_1 = tslib_1.__importDefault(require("i18next"));
const Structure_1 = require("../Structure");
// eslint-disable-next-line @typescript-eslint/ban-types
class SkipSession extends Structure_1.ServerManagerBase {
    constructor(parent) {
        super("SkipManager", parent);
        this.parent = parent;
        this.inited = false;
        this.agreeUsers = new Set();
        this.reply = null;
        this.currentSong = null;
        this.destroyed = false;
        this.issuer = null;
        this.collector = null;
        this.checkThresholdLocker = new async_lock_1.LockObj();
    }
    async init(message) {
        if (this.inited || this.destroyed) {
            throw new Error("This manager has already initialized or destroyed");
        }
        this.inited = true;
        // store current song
        this.currentSong = this.server.queue.get(0);
        // store issuer (skip requestant)
        this.issuer = message.member.username;
        this.agreeUsers.add(message.member.id);
        // prepare collector
        const { collector, customIdMap } = this.parent.bot.collectors.create()
            .setMaxInteraction(Infinity)
            .createCustomIds({
            "skip_vote": "button",
        });
        collector.on("skip_vote", interaction => {
            if (interaction.member) {
                this.vote(interaction.member);
            }
        });
        this.collector = collector;
        this.skipVoteCustomId = customIdMap.skip_vote;
        // send vote pane;
        this.reply = await message.reply(this.createMessageContent());
        collector.setMessage(this.reply);
        return this;
    }
    organize() {
        if (!this.inited || this.destroyed)
            return;
        this.agreeUsers.forEach(userId => {
            if (!this.server.connection || !this.getVoiceMembers().has(userId)) {
                this.agreeUsers.delete(userId);
            }
        });
    }
    vote(user) {
        if (!this.inited || this.destroyed)
            return "ignored";
        this.organize();
        if (!user.voiceState?.channelID || !this.getVoiceMembers().has(user.id)) {
            return "ignored";
        }
        if (this.agreeUsers.has(user.id)) {
            this.agreeUsers.delete(user.id);
            this.checkThreshold().catch(this.logger.error);
            return "cancelled";
        }
        else {
            this.agreeUsers.add(user.id);
            this.checkThreshold().catch(this.logger.error);
            return "voted";
        }
    }
    async checkThreshold() {
        return (0, async_lock_1.lock)(this.checkThresholdLocker, async () => {
            if (!this.inited || this.destroyed) {
                return;
            }
            const members = this.getVoiceMembers();
            this.organize();
            if (this.agreeUsers.size * 2 >= members.size - members.filter(member => member.bot).length) {
                try {
                    const response = this.reply = await this.reply.edit({
                        content: `:ok: ${i18next_1.default.t("components:skip.skipping", { lng: this.parent.locale })}`,
                        embeds: [],
                    });
                    const title = this.server.queue.get(0).basicInfo.title;
                    await this.server.player.stop({ wait: true });
                    await this.server.queue.next();
                    response.edit(`:track_next:${i18next_1.default.t("components:skip.skipped", { title, lng: this.parent.locale })}:white_check_mark:`)
                        .catch(this.logger.error);
                    await this.server.player.play();
                }
                catch (e) {
                    this.logger.error(e);
                    this.reply.edit(`:astonished:${i18next_1.default.t("components:skip.failed", { lng: this.parent.locale })}`)
                        .catch(this.logger.error);
                }
            }
            else {
                const content = this.createMessageContent();
                if (content.embeds[0].description !== this.reply.embeds[0].description) {
                    this.reply = await this.reply.edit(content);
                }
            }
        });
    }
    getVoiceMembers() {
        if (!this.server.connectingVoiceChannel) {
            throw new Error("Voice connection has been already disposed.");
        }
        return this.server.connectingVoiceChannel.voiceMembers;
    }
    createMessageContent() {
        const voiceSize = this.getVoiceMembers().size - 1;
        return {
            embeds: [
                new helper_1.MessageEmbedBuilder()
                    .setTitle(`:person_raising_hand: ${i18next_1.default.t("components:skip.embedTitle", { lng: this.parent.locale })}`)
                    .setDescription(i18next_1.default.t("components:skip.howToUseSkipVote", { title: this.currentSong.basicInfo.title, lng: this.parent.locale })
                    + `${i18next_1.default.t("components:skip.skipVoteDescription", { lng: this.parent.locale })}\r\n\r\n`
                    + `${i18next_1.default.t("components:skip.currentStatus", { lng: this.parent.locale })}: ${this.agreeUsers.size}/${voiceSize}\r\n`
                    + i18next_1.default.t("components:skip.skipRequirement", { lng: this.parent.locale, count: Math.ceil(voiceSize / 2) - this.agreeUsers.size }))
                    .setFooter({
                    text: i18next_1.default.t("components:skip.skipIssuer", { issuer: this.issuer, lng: this.parent.locale }),
                })
                    .toOceanic(),
            ],
            components: [
                new helper_1.MessageActionRowBuilder()
                    .addComponents(new helper_1.MessageButtonBuilder()
                    .setCustomId(this.skipVoteCustomId)
                    .setEmoji("⏩")
                    .setLabel(i18next_1.default.t("components:skip.agree", { lng: this.parent.locale }))
                    .setStyle("PRIMARY"))
                    .toOceanic(),
            ],
        };
    }
    destroy() {
        if (!this.destroyed) {
            this.destroyed = true;
            this.collector.destroy();
        }
    }
}
exports.SkipSession = SkipSession;
//# sourceMappingURL=skipSession.js.map