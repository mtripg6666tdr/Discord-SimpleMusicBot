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

import type { CommandMessage } from "./CommandMessage";
import type { ResponseMessage } from "./ResponseMessage";
import type { GuildDataContainer } from "../Structure";
import type { QueueContent } from "../Structure/QueueContent";
import type { Member } from "oceanic.js";

import { MessageActionRowBuilder, MessageButtonBuilder, MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { ServerManagerBase } from "../Structure";

type voteResult = "voted"|"cancelled"|"ignored";

// eslint-disable-next-line @typescript-eslint/ban-types
export class SkipManager extends ServerManagerBase<{}> {
  private inited = false;
  private readonly agreeUsers = new Set<string>();
  private reply: ResponseMessage = null;
  private currentSong: QueueContent = null;
  private destroyed = false;
  private issuer: string = null;

  constructor(parent: GuildDataContainer){
    super("SkipManager", parent);
  }

  async init(message: CommandMessage){
    if(this.inited || this.destroyed) throw new Error("This manager has already initialized or destroyed");
    this.inited = true;
    this.currentSong = this.server.queue.get(0);
    this.issuer = message.member.username;
    this.agreeUsers.add(message.member.id);
    this.reply = await message.reply(this.createMessageContent());
    return this;
  }

  private organize(){
    if(!this.inited || this.destroyed) return;
    [...this.agreeUsers].forEach(userId => {
      if(!this.server.connection){
        return false;
      }else if(!this.getVoiceMembers().has(userId)){
        return false;
      }
      return true;
    });
  }

  vote(user: Member): voteResult{
    if(!this.inited || this.destroyed) return "ignored";
    this.organize();
    if(!user.voiceState.channelID || !this.getVoiceMembers().has(user.id)){
      return "ignored";
    }
    if(this.agreeUsers.has(user.id)){
      this.agreeUsers.delete(user.id);
      this.checkThreshold();
      return "cancelled";
    }else{
      this.agreeUsers.add(user.id);
      this.checkThreshold();
      return "voted";
    }
  }

  async checkThreshold(){
    if(!this.inited || this.destroyed) return;
    if(this.agreeUsers.size * 2 >= this.getVoiceMembers().size - 1){
      try{
        const response = this.reply = await this.reply.edit(":ok: スキップしています");
        const title = this.server.queue.get(0).basicInfo.title;
        this.server.player.stop();
        await this.server.queue.next();
        await this.server.player.play();
        response.edit(":track_next: `" + title + "`をスキップしました:white_check_mark:")
          .catch(this.logger.error);
      }
      catch(e){
        this.logger.error(e);
        this.reply.edit(":astonished:スキップに失敗しました")
          .catch(this.logger.error);
      }
    }else{
      const content = this.createMessageContent();
      if(content.embeds[0].description !== this.reply.embeds[0].description){
        this.reply.edit(content);
      }
    }
  }

  private getVoiceMembers(){
    return this.server.connectingVoiceChannel.voiceMembers;
  }

  private createMessageContent(){
    const voiceSize = this.getVoiceMembers().size - 1;
    return {
      embeds: [
        new MessageEmbedBuilder()
          .setTitle(":person_raising_hand: スキップの投票")
          .setDescription(`\`${this.currentSong.basicInfo.title}\`のスキップに賛成する場合は以下のボタンを押してください。賛成がボイスチャンネルに参加している人数の過半数を超えると、スキップされます。\r\n\r\n現在の状況: ${this.agreeUsers.size}/${voiceSize}\r\nあと${Math.ceil(voiceSize / 2) - this.agreeUsers.size}人の賛成が必要です。`)
          .setFooter({
            text: `${this.issuer}が、楽曲のスキップを提案しました。`,
          })
          .toOceanic(),
      ],
      components: [
        new MessageActionRowBuilder()
          .addComponents(
            new MessageButtonBuilder()
              .setCustomId(`skip_vote_${this.server.getGuildId()}`)
              .setEmoji("⏩")
              .setLabel("賛成")
              .setStyle("PRIMARY")
          )
          .toOceanic(),
      ],
    };
  }

  destroy(){
    this.destroyed = true;
    this.reply.edit({
      content: this.reply.content,
      embeds: [],
      components: [],
    });
  }
}
