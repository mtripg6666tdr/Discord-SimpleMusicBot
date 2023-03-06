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

const cmap = {
  COMMAND: 0xe9506a,
  HELP: 0x4898f0,
  SEARCH: 0x60f246,
  NP: 0xbc42f7,
  QUEUE: 0xf4bcfc,
  UPTIME: 0xd3fefe,
  SONG_ADDED: 0x77eac8,
  LYRIC: 0xe4f004,
  AUTO_NP: 0xc4f74d,
  PLAYLIST_COMPLETED: 0xf152da,
  THUMB: 0xbeef16,
  RELATIVE_SETUP: 0xfd0202,
  EFFECT: 0xccffcc,
  EQUALLY: 0xf8d53e,
} as const;

export function getColor(key: colorkey): number {
  return cmap[key];
}

type colorkey = keyof typeof cmap;
