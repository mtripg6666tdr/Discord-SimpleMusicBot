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
import type { MessageEmbedBuilder } from "@mtripg6666tdr/eris-command-resolver";
import type { EmbedField} from "eris";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { CommandsManager, BaseCommand } from ".";
import { PageToggle } from "../Component/PageToggle";
import { getColor } from "../Util/color";

export const categories = {
  "voice": "ボイスチャンネル操作系",
  "player": "音楽プレイヤー制御系",
  "playlist": "プレイリスト操作系",
  "utility": "ユーティリティ系",
  "bot": "ボット操作全般"
};
export const categoriesList = ["voice", "player", "playlist", "utility", "bot"];
export default class Commands extends BaseCommand {
  constructor(){
    super({
      unlist: false,
      name: "コマンド",
      alias: ["command", "commands", "cmd"],
      description: "コマンド一覧を表示します。コマンド名を渡すとそのコマンドの詳細を表示します。",
      category: "bot",
      usage: "command [コマンド名]",
      examples: "command search",
      argument: [{
        type: "string",
        description: "詳細表示するするコマンド名",
        name: "command",
        required: false
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    if(options.rawArgs === ""){
      // 引数がない場合は全コマンドの一覧を表示
      const embed = [] as MessageEmbedBuilder[];
      const getCategoryText = (label:string)=>{
        // @ts-ignore
        return categories[label as any] as string;
      };
      const rawcommands = CommandsManager.Instance.Commands.filter(ci => !ci.unlist);
      const commands = {} as {[category:string]:BaseCommand[]};
      // Generate command list
      for(let i = 0; i < rawcommands.length; i++){
        if(commands[rawcommands[i].category]){
          commands[rawcommands[i].category].push(rawcommands[i]);
        }else{
          commands[rawcommands[i].category] = [rawcommands[i]];
        }
      }
      // Generate embed
      for(let i = 0; i < categoriesList.length; i++){
        embed.push(
          new Helper.MessageEmbedBuilder()
            .setTitle(getCategoryText(categoriesList[i]))
            .addFields(
              ...(commands[categoriesList[i]].map(ci => ({
                name: ci.name + ", " + ci.alias.join(", "),
                value: ci.description,
                inline: true
              } as EmbedField)))
            )
        );
      }
      for(let i = 0; i < embed.length; i++){
        embed[i]
          .setTitle("コマンド一覧(" + embed[i].title + ")")
          .setDescription(`コマンドの一覧です。\r\n\`${i + 1}ページ目(${embed.length}ページ中)\`\r\nコマンドプレフィックスは、\`${options.server.prefix}\`です。\r\n\`!コマンド 再生\`のように、コマンド名を引数につけて、そのコマンドの詳細を表示できます。`)
          .setColor(getColor("COMMAND"));
      }
      const msg = await message.reply({embeds: [embed[0].toEris()]});
      const toggle = await PageToggle.init(msg, embed.map(_panel => _panel.toEris()));
      options.embedPageToggle.push(toggle);
    }else{
      const ci = CommandsManager.Instance.resolve(options.rawArgs);
      if(ci && !ci.unlist){
        const prefix = options.server ? options.server.prefix : ">";
        const embed = new Helper.MessageEmbedBuilder()
          .setTitle(`コマンド \`${ci.name}\` の詳細`)
          .setDescription(ci.description)
          .setColor(getColor("COMMAND"))
          .addField("エイリアス", `\`${ci.alias.join("`, `")}\``)
        ;
        if(ci.usage){
          embed.addField("使い方", `\`${prefix}${ci.usage}\` \r\n\`<>\` 内の引数は必須の引数、\`[]\`内の引数は任意の引数です。`);
        }
        if(ci.examples){
          embed.addField("使用例", `\`${prefix + ci.examples}\``);
        }
        await message.reply({embeds: [embed.toEris()]});
      }else{
        await message.reply(":face_with_raised_eyebrow: コマンドが見つかりませんでした");
      }
    }
  }
}
