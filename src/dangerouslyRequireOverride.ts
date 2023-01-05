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

/*
 * Attention!
 * Code in this file does dangerous things!
 * If you want to use these code, please be careful.
 */

import type { m3u8streamFunc, Stream } from "@mtripg6666tdr/m3u8stream";

import Module from "module";

// override `require` to override library behavior
Module.prototype.require = new Proxy(Module.prototype.require, {
  apply(target, thisArg, argArray){
    if(argArray[0] === "m3u8stream"){
      argArray[0] = "@mtripg6666tdr/m3u8stream";
      const m3u8stream = Reflect.apply(target, thisArg, argArray);
      return patchM3u8stream(m3u8stream);
    }else{
      return Reflect.apply(target, thisArg, argArray);
    }
  },
});

/**
 * Apply a patch to module `m3u8stream` to be able to update m3u8 playlist url
 */
function patchM3u8stream(mod:m3u8streamFunc){
  return new Proxy(mod, {
    apply(_target, _thisArg, _argArray){
      const originalResult = Reflect.apply(_target, _thisArg, _argArray) as Stream;
      // patch the result of the original `m3u8stream` method
      originalResult.pipe = new Proxy(originalResult.pipe, {
        apply(__target, __thisArg, __argArray){
          if(__argArray[0]){
            __argArray[0].updatePlaylist = originalResult.updatePlaylist;
            // emit `modified` event to set update tick
            __argArray[0].emit?.("modified");
          }
          return Reflect.apply(__target, __thisArg, __argArray);
        },
      });
      return originalResult;
    },
  });
}
