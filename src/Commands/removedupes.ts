/*
 * Copyright 2021-2025 mtripg6666tdr
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
import type { CommandMessage } from "../Component/commandResolver/CommandMessage";

import { BaseCommand } from ".";

export default class RmDuplicated extends BaseCommand {
  constructor() {
    super({
      alias: ["removedupes", "rmdupes", "rmduplicated", "removeduplicates", "drm"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: ["admin", "onlyListener", "dj"],
      shouldDefer: false,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    // 削除するアイテムのリストを作成
    const q = context.server.queue;
    const indexes: number[] = [];
    const itemUrl: string[] = [];
    q.forEach((item, i) => {
      if (itemUrl.includes(item.basicInfo.url)) {
        indexes.push(i);
      } else {
        itemUrl.push(item.basicInfo.url);
      }
    });
    const dels = Array.from(
      new Set(
        indexes
          .filter(n => !isNaN(n))
          .sort((a, b) => b - a),
      ),
    );

    // 削除を実行する
    const actualDeleted = [] as number[];
    let firstItemTitle = null;
    for (let i = 0; i < dels.length; i++) {
      const item = q.get(dels[i]);
      q.removeAt(dels[i]);
      actualDeleted.push(dels[i]);
      if (actualDeleted.length === 1) {
        firstItemTitle = item.basicInfo.title;
      }
    }

    if (actualDeleted.length > 0) {
      const title = actualDeleted.length === 1 ? firstItemTitle : null;
      const resultStr = actualDeleted.sort((a, b) => a - b).join(",");
      message.reply(
        `🚮${
          resultStr.length > 100
            ? t("commands:removedupes.removedMany")
            : t("commands:removedupes.removedAt", { indexes: resultStr, title: title ? `(\`${title}\`)` : "" })
        }`,
      ).catch(this.logger.error);
    } else {
      message.reply(t("commands:removedupes.noSongRemoved")).catch(this.logger.error);
    }
  }
}
