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
import type * as discord from "oceanic.js";

import { onVoiceChannelJoin, onVoiceChannelLeave } from ".";

export async function onVoiceChannelSwitch(
  this: MusicBot,
  member: discord.Member,
  newChannel: discord.VoiceChannel | discord.StageChannel | discord.Uncached,
  oldChannel: discord.VoiceChannel | discord.StageChannel | discord.Uncached
){
  if(!("guild" in newChannel)) return;

  onVoiceChannelJoin.call(this, member, newChannel).catch(this.logger.error);

  if(member.id === this.client.user.id){
    if(this.guildData.has(member.guild.id)){
      this.getData(member.guild.id)!.connectingVoiceChannel = member.voiceState!.channel!;
    }
  }else{
    onVoiceChannelLeave.call(this, member, oldChannel).catch(this.logger.error);
  }
}
