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

const cmap = {
  "COMMAND": 0xE9506A,
  "HELP": 0x4898F0,
  "SEARCH": 0x60F246,
  "NP": 0xBC42F7,
  "QUEUE": 0xF4BCFC,
  "UPTIME": 0xD3FEFE,
  "SONG_ADDED": 0x77EAC8,
  "LYRIC": 0xE4F004,
  "AUTO_NP": 0xC4F74D,
  "PLAYLIST_COMPLETED": 0xF152DA,
  "THUMB": 0xBEEF16,
  "RELATIVE_SETUP": 0xFD0202,
  "EFFECT": 0xCCFFCC,
  "EQUALLY": 0xF8D53E,
} as const;

export function getColor(key:colorkey):number{
  return cmap[key];
}

type colorkey = keyof typeof cmap;
