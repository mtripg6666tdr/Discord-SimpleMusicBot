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

import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class RmDuplicated extends BaseCommand {
  constructor() {
    super({
      name: "重複削除",
      alias: ["removedupes", "rmdupes", "rmduplicated", "removeduplicates", "drm"],
      description: "キュー内の重複（ちょうふく）している曲を削除します。",
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: ["admin", "onlyListener", "dj"],
      shouldDefer: false,
    });
  }

  async run(message: CommandMessage, options: CommandArgs) {
    options.server.updateBoundChannel(message);
    const q = options.server.queue;
    const indexes: number[] = [];
    const itemUrl: string[] = [];
    q.forEach((item, i) => {
      if (itemUrl.includes(item.basicInfo.Url)) {
        indexes.push(i);
      } else {
        itemUrl.push(item.basicInfo.Url);
      }
    });
    const dels = Array.from(new Set(indexes.filter(n => !isNaN(n)).sort((a, b) => b - a)));
    const actualDeleted = [] as number[];
    const failed = [] as number[];
    let firstItemTitle = null;
    for (let i = 0; i < dels.length; i++) {
      const item = q.get(dels[i]);
      q.removeAt(dels[i]);
      actualDeleted.push(dels[i]);
      if (actualDeleted.length === 1) {
        firstItemTitle = item.basicInfo.Title;
      }
    }
    if (actualDeleted.length > 0) {
      const title = actualDeleted.length === 1 ? firstItemTitle : null;
      const resultStr = actualDeleted.sort((a, b) => a - b).join(",");
      const failedStr = failed.sort((a, b) => a - b).join(",");
      message
        .reply(
          `🚮${resultStr.length > 100 ? "重複していた" : `${resultStr}番目の`}曲${
            title ? "(`" + title + "`)" : ""
          }を削除しました${
            failed.length > 0
              ? `\r\n:warning:${
                  failed.length > 100 ? "一部" : `${failedStr}番目`
                }の曲は権限がないため削除できませんでした。`
              : ""
          }`,
        )
        .catch(e => Util.logger.log(e, "error"));
    } else {
      message.reply("削除できる楽曲がありませんでした。").catch(e => Util.logger.log(e, "error"));
    }
  }
}
