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

import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { YmxVersion } from "../Structure";
import { Util } from "../Util";

export default class Export extends BaseCommand {
  constructor(){
    super({
      name: "エクスポート",
      alias: ["export"],
      description: "キューの内容をインポートできるようエクスポートします。",
      unlist: false,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.server.queue.length === 0){
      message.reply("キューが空です。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const qd = options.server.exportQueue();
    await message.reply({
      content: "✅エクスポートしました",
      files: [{
        file: Buffer.from(qd),
        name: "exported_queue.ymx",
      }]
    })
      .then(msg => msg.edit(`✅エクスポートしました (バージョン: v${YmxVersion}互換)\r\nインポート時は、「<${msg.url}>」をimportコマンドの引数に指定してください`))
      .catch(e => Util.logger.log(e, "error"))
    ;
  }
}
