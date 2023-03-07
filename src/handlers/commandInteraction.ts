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

import type { GuildDataContainer } from "../Structure";
import type { MusicBot } from "../bot";

import { CommandMessage } from "@mtripg6666tdr/eris-command-resolver";
import * as discord from "eris";

import { CommandManager } from "../Component/CommandManager";
import { GuildDataContainerWithBgm } from "../Structure/GuildDataContainerWithBgm";
import Util from "../Util";
import { NotSendableMessage } from "../definition";

export async function handleCommandInteraction(this: MusicBot, server: GuildDataContainer, interaction: discord.CommandInteraction){
  this.Log("reveived command interaction");
  if(!(interaction.channel instanceof discord.TextChannel)){
    await interaction.createMessage("テキストチャンネルで実行してください");
    return;
  }
  // 送信可能か確認
  if(!Util.eris.channel.checkSendable(interaction.channel, this._client.user.id)){
    await interaction.createMessage(NotSendableMessage);
    return;
  }
  // コマンドを解決
  const command = CommandManager.instance.resolve(interaction.data.name);
  if(command){
    if(
      // BGM構成が存在するサーバー
      server instanceof GuildDataContainerWithBgm
      && (
        
      // いまBGM再生中
        server.queue.isBGM
          && (
            // キューの編集を許可していない、またはBGM優先モード
            !server.bgmConfig.allowEditQueue || server.bgmConfig.mode === "prior"
          )
        
        // BGMが再生していなければ、BGMオンリーモードであれば
        || server.bgmConfig.mode === "only"
      )
      // かつBGM構成で制限があるときに実行できないコマンドならば
      && command.category !== "utility" && command.category !== "bot" && command.name !== "ボリューム"
    ){
      // 無視して返却
      return;
    }
    // 応答遅延するべきコマンドならば遅延
    if(command.shouldDefer){
      await interaction.defer();
    }
    // メッセージライクに解決してコマンドメッセージに 
    const commandMessage = CommandMessage.createFromInteraction(interaction as discord.CommandInteraction<discord.GuildTextableWithThread>);
    // プレフィックス更新
    server.updatePrefix(commandMessage);
    // コマンドを実行
    await command.checkAndRun(commandMessage, this["createCommandRunnerArgs"](commandMessage.guild.id, commandMessage.options, commandMessage.rawOptions));
  }else{
    await interaction.createMessage("おっと！なにかが間違ってしまったようです。\r\nコマンドが見つかりませんでした。 :sob:");
  }
}
