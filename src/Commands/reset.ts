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
import { Util } from "../Util";

export default class Reset extends BaseCommand {
  constructor(){
    super({
      name: "リセット",
      alias: ["reset"],
      description: "サーバーのキュー、設定やデータを削除して初期化します。\r\n※接続中の場合ボイスチャンネルから離脱します。",
      unlist: false,
      category: "utility",
      permissionDescription: "サーバーの管理権限",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(!message.member.permissions.has("manageGuild")){
      message.reply("この操作を実行する権限がありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    options.server.updateBoundChannel(message);
    // VC接続中なら切断
    if(options.server.player.isConnecting){
      options.server.player.disconnect();
    }
    options.server.bot.resetData(message.guild.id);
    // データ初期化
    options.initData(message.guild.id, message.channel.id);
    message.reply("✅サーバーの設定を初期化しました").catch(e => Util.logger.log(e, "error"));
  }
}
