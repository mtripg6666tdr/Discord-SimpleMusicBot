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
exports.channels = exports.users = void 0;
const config_1 = require("../config");
const config = (0, config_1.getConfig)();
exports.users = {
    isDJ(member, options) {
        return exports.channels.sameVC(member, options)
            && member.roles.some(roleId => config.djRoleNames.includes(member.guild.roles.get(roleId).name));
    },
    isPrivileged(member) {
        return member.permissions.has("MANAGE_GUILD")
            || member.permissions.has("MANAGE_CHANNELS")
            || member.permissions.has("ADMINISTRATOR");
    },
};
const requirePermissions = [
    "SEND_MESSAGES",
    "EMBED_LINKS",
    "MANAGE_MESSAGES",
    "ATTACH_FILES",
    "READ_MESSAGE_HISTORY",
    "VIEW_CHANNEL",
];
exports.channels = {
    checkSendable(channel, userId) {
        const permissions = channel.permissionsOf(userId);
        return requirePermissions.every(permission => permissions.has(permission));
    },
    getVoiceMember(options) {
        if (!options.server.player.isConnecting)
            return null;
        return options.server.connectingVoiceChannel.voiceMembers || null;
    },
    sameVC(member, options) {
        return this.getVoiceMember(options)?.has(member.id) || false;
    },
    voiceMemberCount(options) {
        return this.getVoiceMember(options)?.size || 0;
    },
    isOnlyListener(member, options) {
        const vcMember = this.getVoiceMember(options);
        if (!vcMember)
            return false;
        if (vcMember.filter(m => !m.bot).length > 1)
            return false;
        return vcMember.has(member.id);
    },
};
//# sourceMappingURL=discord.js.map