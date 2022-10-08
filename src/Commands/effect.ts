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
import { getCurrentEffectPanel } from "../Util/effect";

export default class Effect extends BaseCommand {
  constructor(){
    super({
      name: "エフェクト",
      alias: ["effect", "音声エフェクト", "音声効果", "効果"],
      description: "エフェクトコントロールパネルを表示します",
      unlist: false,
      category: "player",
      permissionDescription: "なし",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    try{
      const {embed, messageActions } = getCurrentEffectPanel(message.member.avatarURL, options.server);
      const reply = await message.reply({
        content: "",
        embeds: [embed.toEris()],
        components: [messageActions]
      });
      setTimeout(() => {
        reply.edit({components: []});
      }, 5 * 60 * 1000);
    }
    catch(e){
      Util.logger.log(e, "error");
      message.reply(":cry:エラーが発生しました").catch(er => Util.logger.log(er, "error"));
    }
  }
}
