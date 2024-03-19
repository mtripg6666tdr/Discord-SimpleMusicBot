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

import { Cache } from "./base";
import { YoutubeDlInfo, baseYoutubeDlStrategy } from "./baseYoutubeDlStrategy";
import { BinaryManager } from "../../../Component/binaryManager";

const ytDlPBinaryManager = new BinaryManager({
  binaryName: "yt-dlp",
  localBinaryName: "yt-dlp",
  binaryRepo: "yt-dlp/yt-dlp",
  checkImmediately: false,
});

type ytDlP = "ytDlP";
const ytDlP: ytDlP = "ytDlP";

export class ytDlPStrategy extends baseYoutubeDlStrategy<ytDlP> {
  constructor(priority: number){
    super(priority, ytDlP, ytDlPBinaryManager);
  }

  protected override cacheIsValid(cache?: Cache<any, any> | undefined): cache is Cache<ytDlP, YoutubeDlInfo> {
    return cache?.type === ytDlP;
  }
}

export default ytDlPStrategy;
