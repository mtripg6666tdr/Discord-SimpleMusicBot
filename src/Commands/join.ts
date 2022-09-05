/*
 * Copyright 2021-2022 mtripg6666tdr
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

import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";
import type { VoiceChannel } from "eris";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Join extends BaseCommand {
  constructor(){
    super({
      name: "接続",
      alias: ["join", "参加", "connect"],
      description: "ボイスチャンネルに参加します",
      unlist: false,
      category: "voice",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(message.member.voiceState.channelID && (options.client.getChannel(message.member.voiceState.channelID) as VoiceChannel).voiceMembers.has(options.client.user.id) && options.server.connection){
      message.reply("✘すでにボイスチャンネルに接続中です。").catch(e => Util.logger.log(e, "error"));
    }else{
      await options.server.joinVoiceChannel(message, /* reply result to user inside this method  */ true);
    }
  }
}
