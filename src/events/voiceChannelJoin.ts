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

import type { MusicBot } from "../bot";
import type * as discord from "oceanic.js";

import i18next from "i18next";

import { GuildDataContainerWithBgm } from "../Structure/GuildDataContainerWithBgm";

export async function onVoiceChannelJoin(
  this: MusicBot,
  member: discord.Member,
  newChannel: discord.VoiceChannel | discord.StageChannel | discord.Uncached
){
  if(!("guild" in newChannel)) return;
  const server = this.guildData.get(member.guild.id);
  if(!server){
    return;
  }

  if(member.id === this._client.user.id){
    // ボットが参加した際
    // ミュート状態/抑制状態なら自分で解除を試みる
    if(member.voiceState?.suppress || member.voiceState?.mute){
      // VC参加 => 抑制状態ならそれの解除を試みる
      const voiceChannel = this._client.getChannel<discord.VoiceChannel | discord.StageChannel>(newChannel.id)!;
      if(!("guild" in voiceChannel)) return;
      voiceChannel.guild.editMember(this._client.user.id, {
        mute: false,
      }).catch(er => {
        this.logger.warn(er);
        voiceChannel.guild.editUserVoiceState(this._client.user.id, {
          channelID: newChannel.id,
          suppress: false,
        })
          .catch(er2 => {
            this.logger.warn(er2);
            this._client.rest.channels.createMessage(
              this.guildData.get((newChannel as discord.VoiceChannel).guild.id)!.boundTextChannel,
              {
                content: `:sob:${i18next.t("suppressed", { lng: server.locale })}`,
              }
            )
              .catch(this.logger.error);
          });
      });
      this.emit("onBotVoiceChannelJoin", voiceChannel);
    }

    return;
  }

  server.skipSession?.checkThreshold().catch(this.logger.error);

  if(
    server instanceof GuildDataContainerWithBgm
      && (
        newChannel.id === server.bgmConfig.voiceChannelId
        && (
          (
            (
              !server.connection
              || (server.bgmConfig.mode === "prior" && server.connectingVoiceChannel!.id !== server.bgmConfig.voiceChannelId))
            && !server.queue.isBGM
          )
          || server.player.finishTimeout
        )
      )
  ){
    // BGMを再生する条件が整っている
    server.playBgmTracks().catch(this.logger.error);
  }else if(server.player.isPaused){
    // 自動で一時停止している場合には再開
    server.player.resume(member);
  }
}
