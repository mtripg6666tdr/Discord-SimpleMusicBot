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

import type { InteractionCollector } from "./collectors/InteractionCollector";
import type { CommandMessage } from "./commandResolver/CommandMessage";
import type { ResponseMessage } from "./commandResolver/ResponseMessage";
import type { GuildDataContainer } from "../Structure";
import type { QueueContent } from "../Structure/QueueContent";
import type { Member } from "oceanic.js";

import { lock, LockObj } from "@mtripg6666tdr/async-lock";
import { MessageActionRowBuilder, MessageButtonBuilder, MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";
import i18next from "i18next";

import { ServerManagerBase } from "../Structure";

type voteResult = "voted"|"cancelled"|"ignored";

// eslint-disable-next-line @typescript-eslint/ban-types
export class SkipSession extends ServerManagerBase<{}> {
  protected inited = false;
  protected readonly agreeUsers = new Set<string>();
  protected reply: ResponseMessage = null!;
  protected currentSong: QueueContent = null!;
  protected destroyed = false;
  protected issuer: string = null!;
  protected skipVoteCustomId: string;
  protected collector: InteractionCollector = null!;

  constructor(protected parent: GuildDataContainer){
    super("SkipManager", parent);
  }

  async init(message: CommandMessage){
    if(this.inited || this.destroyed){
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
      if(interaction.member){
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

  private organize(){
    if(!this.inited || this.destroyed) return;
    this.agreeUsers.forEach(userId => {
      if(!this.server.connection || !this.getVoiceMembers().has(userId)){
        this.agreeUsers.delete(userId);
      }
    });
  }

  protected vote(user: Member): voteResult{
    if(!this.inited || this.destroyed) return "ignored";
    this.organize();
    if(!user.voiceState?.channelID || !this.getVoiceMembers().has(user.id)){
      return "ignored";
    }
    if(this.agreeUsers.has(user.id)){
      this.agreeUsers.delete(user.id);
      this.checkThreshold().catch(this.logger.error);
      return "cancelled";
    }else{
      this.agreeUsers.add(user.id);
      this.checkThreshold().catch(this.logger.error);
      return "voted";
    }
  }

  readonly checkThresholdLocker = new LockObj();
  async checkThreshold(){
    return lock(this.checkThresholdLocker, async () => {
      if(!this.inited || this.destroyed){
        return;
      }
      const members = this.getVoiceMembers();
      this.organize();
      if(this.agreeUsers.size * 2 >= members.size - members.filter(member => member.bot).length){
        try{
          const response = this.reply = await this.reply.edit({
            content: `:ok: ${i18next.t("components:skip.skipping", { lng: this.parent.locale })}`,
            embeds: [],
          });
          const title = this.server.queue.get(0).basicInfo.title;
          await this.server.player.stop({ wait: true });
          await this.server.queue.next();

          response.edit(`:track_next:${i18next.t("components:skip.skipped", { title, lng: this.parent.locale })}:white_check_mark:`)
            .catch(this.logger.error);

          await this.server.player.play();
        }
        catch(e){
          this.logger.error(e);
          this.reply.edit(`:astonished:${i18next.t("components:skip.failed", { lng: this.parent.locale })}`)
            .catch(this.logger.error);
        }
      }else{
        const content = this.createMessageContent();
        if(content.embeds[0].description !== this.reply.embeds[0].description){
          this.reply = await this.reply.edit(content);
        }
      }
    });
  }

  private getVoiceMembers(){
    if(!this.server.connectingVoiceChannel){
      throw new Error("Voice connection has been already disposed.");
    }

    return this.server.connectingVoiceChannel.voiceMembers;
  }

  private createMessageContent(){
    const voiceSize = this.getVoiceMembers().size - 1;
    return {
      embeds: [
        new MessageEmbedBuilder()
          .setTitle(`:person_raising_hand: ${i18next.t("components:skip.embedTitle", { lng: this.parent.locale })}`)
          .setDescription(
            i18next.t("components:skip.howToUseSkipVote", { title: this.currentSong.basicInfo.title, lng: this.parent.locale })
            + `${i18next.t("components:skip.skipVoteDescription", { lng: this.parent.locale })}\r\n\r\n`
            + `${i18next.t("components:skip.currentStatus", { lng: this.parent.locale })}: ${this.agreeUsers.size}/${voiceSize}\r\n`
            + i18next.t("components:skip.skipRequirement", { lng: this.parent.locale, count: Math.ceil(voiceSize / 2) - this.agreeUsers.size })
          )
          .setFooter({
            text: i18next.t("components:skip.skipIssuer", { issuer: this.issuer, lng: this.parent.locale }),
          })
          .toOceanic(),
      ],
      components: [
        new MessageActionRowBuilder()
          .addComponents(
            new MessageButtonBuilder()
              .setCustomId(this.skipVoteCustomId)
              .setEmoji("⏩")
              .setLabel(i18next.t("components:skip.agree", { lng: this.parent.locale }))
              .setStyle("PRIMARY")
          )
          .toOceanic(),
      ],
    };
  }

  destroy(){
    if(!this.destroyed){
      this.destroyed = true;
      this.collector.destroy();
    }
  }
}
