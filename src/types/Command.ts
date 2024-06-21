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

import type { categoriesList } from "../Commands/command";
import type { GuildDataContainer } from "../Structure";
import type { MusicBot } from "../bot";
import type { Client, LocaleMap, PermissionName } from "oceanic.js";

import { i18n } from "i18next";

export type CommandPermission =
  | "admin"
  | "dj"
  | "sameVc"
  | "manageMessages"
  | "manageGuild"
  | "onlyListener"
  | "noConnection"
  | "onlyBotInVc"
;

export type BaseCommandInitializeOptions = {
  alias: Readonly<string[]>,
  shouldDefer: boolean,
  disabled?: boolean,
};

type BaseListCommand = BaseCommandInitializeOptions & {
  unlist: false,
  category: typeof categoriesList[number],
  requiredPermissionsOr: CommandPermission[],
  messageCommand?: boolean,
  interactionOnly?: boolean,
  defaultMemberPermission?: PermissionName[] | "NONE",
};

type CommandHelp = {
  examples: boolean,
  usage: boolean,
};

export type ListCommandWithArgsOptions = BaseListCommand & CommandHelp & {
  args: readonly SlashCommandArgument[],
};

export type ListCommandWithoutArgsOptions = BaseListCommand & Partial<CommandHelp>;

export type ListCommandInitializeOptions =
  | ListCommandWithArgsOptions
  | ListCommandWithoutArgsOptions;

export type UnlistCommandOptions = BaseCommandInitializeOptions & {
  unlist: true,
  name: string,
  description?: string,
  usage?: string,
  examples?: string,
  category?: typeof categoriesList[number],
  argument?: { type: CommandOptionsTypes, name: string, description?: string, required: boolean }[],
  requiredPermissionsOr?: CommandPermission[],
};

export type CommandOptionsTypes = "bool" | "integer" | "string" | "file";

/**
 * スラッシュコマンドの引数として取れるものを定義するインターフェースです
 */
export type SlashCommandArgument = {
  type: CommandOptionsTypes,
  name: string,
  required: boolean,
  choices?: [firstChoice: string, ...restChoices: string[]],
  autoCompleteEnabled?: boolean,
};

export type LocalizedSlashCommandArgument = Omit<SlashCommandArgument, "choices"> & {
  description: string,
  descriptionLocalization: LocaleMap,
  choices?: {
    name: string,
    value: string,
    nameLocalizations: LocaleMap,
  }[],
};

/**
 * コマンドのランナに渡される引数
 */
export interface CommandArgs {
  /**
   * ボットのインスタンス
   */
  bot: Readonly<MusicBot>;
  /**
   * ボットのサーバーデータ
   */
  server: GuildDataContainer;
  /**
   * コマンドの生の引数
   */
  rawArgs: Readonly<string>;
  /**
   * コマンドのパース済み引数
   */
  args: readonly string[];
  /**
   * ボットのクライアント
   */
  client: Readonly<Client>;
  /**
   * サーバーデータの初期化関数
   * @param guildid サーバーID
   * @param channelid チャンネルID
   */
  initData: (guildid: string, channelid: string) => GuildDataContainer;
  /**
   * メンションをメッセージに含めるか
   */
  includeMention: boolean;
  /**
   * ユーザーのロケール
   */
  locale: string;
  /**
   * ロケールに適したt関数
   */
  t: i18n["t"];
}
