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

import type { categories } from "../Commands/commands";
import type { PageToggle } from "../Component/PageToggle";
import type { GuildDataContainer } from "../Structure";
import type { MusicBot } from "../bot";
import type { Client } from "eris";

export type BaseCommandInitializeOptions = {
  name:string,
  alias:Readonly<string[]>,
};

export type ListCommandWithArgumentsInitializeOptions = BaseCommandInitializeOptions & {
  description:string,
  unlist:boolean,
  examples:string,
  usage:string,
  category:keyof typeof categories,
  argument:SlashCommandArgument[],
  permissionDescription:string,
};

export type ListCommandWithoutArgumentsInitializeOptions = BaseCommandInitializeOptions & {
  description:string,
  unlist:false,
  category:keyof typeof categories,
  permissionDescription:string,
};

export type ListCommandInitializeOptions =
  | ListCommandWithArgumentsInitializeOptions
  | ListCommandWithoutArgumentsInitializeOptions
;

export type UnlistCommandInitializeOptions = BaseCommandInitializeOptions & {
  unlist:true,
};

export type CommandOptionsTypes = "bool"|"integer"|"string";

/**
 * スラッシュコマンドの引数として取れるものを定義するインターフェースです
 */
export interface SlashCommandArgument {
  type:CommandOptionsTypes;
  name:string;
  description:string;
  required:boolean;
  choices?:{[key:string]:string|number};
}

/**
 * コマンドのランナに渡される引数
 */
export interface CommandArgs {
  /**
   * ボットのインスタンス
   */
  bot:Readonly<MusicBot>;
  /**
   * ボットのサーバーデータ
   */
  server:GuildDataContainer;
  /**
   * コマンドの生の引数
   */
  rawArgs:Readonly<string>;
  /**
   * コマンドのパース済み引数
   */
  args:readonly string[];
  /**
   * 生存しているPageToggleの配列
   */
  embedPageToggle:PageToggle[];
  /**
   * ボットのクライアント
   */
  client:Readonly<Client>;
  /**
   * サーバーデータの初期化関数
   * @param guildid サーバーID
   * @param channelid チャンネルID
   */
  initData: (guildid:string, channelid:string) => void;
}
