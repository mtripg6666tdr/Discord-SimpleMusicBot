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

import type { CommandArgs } from "../../Commands";
import type { Member } from "eris";

import { channelUtil } from "./channel";

export const userUtil = {
  getDisplayName(member:Member){
    return member.nick || member.username;
  },
  isDJ(member:Member, options:CommandArgs){
    return channelUtil.sameVC(member, options) && member.roles.some(roleId => member.guild.roles.get(roleId).name === "DJ");
  },
  isPrivileged(member:Member){
    return member.permissions.has("manageGuild")
      || member.permissions.has("manageChannels")
      || member.permissions.has("administrator");
  },
} as const;
