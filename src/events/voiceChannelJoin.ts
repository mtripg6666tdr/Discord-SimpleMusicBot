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

import type { MusicBot } from "../bot";
import type * as discord from "eris";

import { GuildDataContainerWithBgm } from "../Structure/GuildDataContainerWithBgm";

export async function onVoiceChannelJoin(this: MusicBot, member: discord.Member, newChannel: discord.TextVoiceChannel){
  if(member.id === this._client.user.id){
    // ボットが参加した際
    // ミュート状態/抑制状態なら自分で解除を試みる
    if(member.voiceState.suppress || member.voiceState.mute){
      // VC参加
      const voiceChannel = this._client.getChannel(newChannel.id) as discord.VoiceChannel;
      voiceChannel.guild.editVoiceState({
        channelID: newChannel.id,
        suppress: false,
      }).catch(() => {
        voiceChannel.guild.members.get(this._client.user.id)
          .edit({
            mute: false,
          })
          .catch(() => {
            this._client.createMessage(this.guildData.get(newChannel.guild.id).boundTextChannel, ":sob:発言が抑制されています。音楽を聞くにはサーバー側ミュートを解除するか、[メンバーをミュート]権限を渡してください。")
              .catch(e => this.Log(e));
          });
      });
      this.emit("onBotVoiceChannelJoin", voiceChannel);
    }
  }else if(this.guildData.has(member.guild.id)){
    const server = this.guildData.get(member.guild.id);
    server.skipSession?.checkThreshold();
    if(
      server instanceof GuildDataContainerWithBgm
        && (
          newChannel.id === server.bgmConfig.voiceChannelId
          && (
            
            (!server.connection || server.bgmConfig.mode === "prior" && server.connection.channelID !== server.bgmConfig.voiceChannelId)
              && !server.queue.isBGM
            
            || server.player.finishTimeout
          )
        )
    ){
      // BGMターゲット
      server.playBgmTracks();
    }
  }
}
