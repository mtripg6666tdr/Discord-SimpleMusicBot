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

// This type declaration is just for building on Node.js v16.x
// @distube/ytsr has been dropped its support for v16.x or lower.
// Building with Node.js v18+, the type definition packed in @distube/ytsr should take priority over below stub types.
// This file should be removed when dropping the Node.js v16 support.
declare module "@distube/ytsr" {
  namespace _EXPORT {
    type Video = any;
    type VideoResult = any;
  }
  declare function _EXPORT(...args: any[]): any;
  export = _EXPORT;
}
