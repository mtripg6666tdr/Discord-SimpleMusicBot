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

import { QueueManagerWithBgm } from "../Component/QueueManagerWithBGM";
import Util from "../Util";

export async function onVoiceChannelLeave(
  this: MusicBot,
  member: discord.Member,
  oldChannel: discord.VoiceChannel | discord.StageChannel | discord.Uncached,
){
  if(!("guild" in oldChannel)) return;
  const server = this.guildData.get(oldChannel.guild.id);
  if(!server || !server.connection) return;

  if(member.id === this._client.user.id){
    // サーバー側からのボットの切断
    this.Log(`forced to disconnect from VC (${server.connectingVoiceChannel?.id})`);
    server.player.disconnect();
    await this._client.rest.channels.createMessage(
      server.boundTextChannel,
      {
        content: ":postbox: 正常に切断しました",
      }
    ).catch(e => this.Log(e, "error"));
  }else if(oldChannel.voiceMembers.has(this._client.user.id) && oldChannel.voiceMembers.size === 1){
    if(server.queue instanceof QueueManagerWithBgm && server.queue.isBGM){
      server.player.disconnect();
    }else if(server.player.isPlaying && !Util.config.twentyFourSeven.includes(oldChannel.id) && !Util.config.alwaysTwentyFourSeven){
      // 誰も聞いてる人がいない
      if(
        server.player.currentAudioInfo.LengthSeconds > 60
        && server.player.currentAudioInfo.LengthSeconds - server.player.currentTime / 1000 < 10
      ){
        // かつ、楽曲の長さが60秒以上
        // かつ、残り時間が10秒以内
        // ならば、切断。
        this.Log(`audio left less than 10sec; automatically disconnected from VC (${server.connectingVoiceChannel?.id})`);
        server.player.disconnect();
        if(!server.queue.onceLoopEnabled && !server.queue.loopEnabled) server.queue.next();
        await this._client.rest.channels.createMessage(
          server.boundTextChannel,
          {
            content: ":postbox: 正常に切断しました",
          }
        ).catch(e => this.Log(e, "error"));
      }else if(!server.player.isPaused){
        // すでに一時停止されていないならば、一時停止する
        server.player.pause();
        await this._client.rest.channels.createMessage(
          server.boundTextChannel,
          {
            content: ":pause_button:ボイスチャンネルから誰もいなくなったため一時停止しました。`再生`コマンドで再開できます。",
          }
        ).catch(e => this.Log(e));
        const timer = setTimeout(() => {
          server.player.off("playCalled", playHandler);
          server.player.off("disconnect", playHandler);
          if(server.player.isPaused){
            this._client.rest.channels.createMessage(
              server.boundTextChannel,
              {
                content: ":postbox: 長時間使用しなかったため、終了します",
              }).catch(e => this.Log(e, "error")
            );
            server.player.disconnect();
          }
        }, 10 * 60 * 1000).unref();
        const playHandler = () => clearTimeout(timer);
        server.player.once("playCalled", playHandler);
        server.player.once("disconnect", playHandler);
      }
    }else if(server.player.finishTimeout){
      server.player.disconnect();
      await this._client.rest.channels.createMessage(
        server.boundTextChannel,
        {
          content: ":postbox: 正常に切断しました",
        }
      ).catch(e => this.Log(e, "error"));
    }
  }
  server.skipSession?.checkThreshold();
}
