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

import { Cache } from "./base";
import { YoutubeDlInfo, baseYoutubeDlStrategy } from "./baseYoutubeDlStrategy";
import { BinaryManager } from "../../../Component/binaryManager";

const ytDlNightlyBinaryManager = new BinaryManager({
  binaryName: "youtube-dl",
  localBinaryName: "ydn_youtube-dl",
  binaryRepo: "ytdl-org/ytdl-nightly",
  checkImmediately: false,
});

type nightlyYoutubeDl = "ytDlNightlyYoutubeDl";
const nightlyYoutubeDl: nightlyYoutubeDl = "ytDlNightlyYoutubeDl";

export class NightlyYoutubeDl extends baseYoutubeDlStrategy<nightlyYoutubeDl> {
  constructor(priority: number) {
    super(priority, nightlyYoutubeDl, ytDlNightlyBinaryManager);
  }

  protected override cacheIsValid(cache?: Cache<any, any> | undefined): cache is Cache<nightlyYoutubeDl, YoutubeDlInfo> {
    return cache?.type === NightlyYoutubeDl;
  }
}

export default NightlyYoutubeDl;
