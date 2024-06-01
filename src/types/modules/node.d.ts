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

declare namespace NodeJS {
  interface ProcessEnv {
    readonly TOKEN: string;
    readonly CSE_KEY?: string;
    readonly DB_URL?: string;
    readonly DB_TOKEN?: string;
    readonly PORT?: string;
    readonly LOG_TRANSFER_PORT?: string;
    readonly DISABLE_TELEMETRY?: string;
    /* undocumented flags */
    readonly DSL_ENABLE?: string;
    readonly BD_ENABLE?: string;
    readonly CONSOLE_ENABLE?: string;
    readonly DISABLE_SYNC_SC?: string;
    readonly HIDE_REPO_URL?: string;
    readonly SUPPORT_SERVER_URL?: string;
    readonly HIDE_SUPPORT_SERVER_URL?: string;
  }
}
