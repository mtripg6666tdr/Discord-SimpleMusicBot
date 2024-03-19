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

import type { CommandMessage } from "../Component/commandResolver/CommandMessage";
import type { GuildDataContainer } from "../Structure";
import type { ListCommandInitializeOptions, UnlistCommandOptions, ListCommandWithArgsOptions, CommandArgs, CommandPermission, LocalizedSlashCommandArgument } from "../Structure/Command";
import type { LoggerObject } from "../logger";
import type { AnyTextableGuildChannel, ApplicationCommandOptionsBoolean, ApplicationCommandOptionsChoice, ApplicationCommandOptionsInteger, ApplicationCommandOptionsString, CreateApplicationCommandOptions, LocaleMap, ModalSubmitInteraction, PermissionName } from "oceanic.js";

import i18next from "i18next";
import { InteractionTypes, Permissions, TypedEmitter, ApplicationCommandTypes } from "oceanic.js";

import { CommandManager } from "../Component/commandManager";
import { discordUtil } from "../Util";
import { availableLanguages } from "../i18n";
import { getLogger } from "../logger";

export { CommandArgs } from "../Structure/Command";

interface CommandEvents {
  run: [Readonly<CommandArgs>];
}

/**
 * すべてのコマンドハンドラーの基底クラスです
 */
export abstract class BaseCommand extends TypedEmitter<CommandEvents> {
  /** ボットを実行します */
  protected abstract run(message: CommandMessage, context: Readonly<CommandArgs>, t: (typeof i18next)["t"]): Promise<void>;

  // eslint-disable-next-line unused-imports/no-unused-vars
  handleAutoComplete(argname: string, input: string | number, otherOptions: { name: string, value: string | number }[]): string[] {
    return [];
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  async handleModalSubmitInteraction(interaction: ModalSubmitInteraction<AnyTextableGuildChannel>, server: GuildDataContainer){
  }

  protected readonly _name: string;
  public get name(){
    return this._name;
  }

  protected readonly _alias: Readonly<string[]>;
  public get alias(){
    return this._alias;
  }

  protected readonly _description: string;
  public get description(){
    return this._description;
  }

  protected readonly _unlist: boolean;
  public get unlist(){
    return this._unlist;
  }

  protected readonly _examples: LocaleMap | null;
  public get examples(){
    return this._examples;
  }

  protected readonly _usage: LocaleMap | null;
  public get usage(){
    return this._usage;
  }

  protected readonly _category: string;
  public get category(){
    return this._category;
  }

  protected readonly _shouldDefer: boolean = false;
  public get shouldDefer(){
    return this._shouldDefer;
  }

  protected readonly _argument: Readonly<LocalizedSlashCommandArgument[]> | null;
  public get argument(){
    return this._argument;
  }

  protected readonly _requiredPermissionsOr: CommandPermission[];
  public get requiredPermissionsOr(){
    return this._requiredPermissionsOr || [];
  }

  protected readonly _descriptionLocalization: LocaleMap;
  get descriptionLocalization(){
    return this._descriptionLocalization;
  }

  protected readonly _disabled: boolean = false;
  get disabled(){
    return this._disabled;
  }

  protected readonly _messageCommand: boolean = false;
  get messageCommand(){
    return this._messageCommand;
  }

  protected readonly _interactionOnly: boolean = false;
  get interactionOnly(){
    return this._interactionOnly;
  }

  protected readonly _defaultMemberPermission: PermissionName[] | "NONE" = "NONE";
  get defaultMemberPermission(){
    return this._defaultMemberPermission;
  }

  /** スラッシュコマンドの名称として登録できる旧基準を満たしたコマンド名を取得します */
  get asciiName(){
    return this.alias.filter(c => c.match(/^[\w-]{2,32}$/))[0];
  }

  protected readonly logger: LoggerObject;

  constructor(opts: ListCommandInitializeOptions|UnlistCommandOptions){
    super();
    this._messageCommand = "messageCommand" in opts && opts.messageCommand || false;
    this._interactionOnly = "interactionOnly" in opts && opts.interactionOnly || false;
    this._alias = opts.alias;
    this._name = "name" in opts
      ? opts.name
      : this._interactionOnly
        ? opts.alias[0]
        : i18next.t(`commands:${this.asciiName}.name` as any);
    this._unlist = opts.unlist;
    this._shouldDefer = opts.shouldDefer;
    this._disabled = opts.disabled || false;
    if(!this._unlist){
      if(!this.asciiName){
        throw new Error("Command has not ascii name");
      }

      const {
        examples,
        usage,
        category,
        argument,
        requiredPermissionsOr,
        defaultMemberPermission,
      } = opts as ListCommandWithArgsOptions;

      this._description = i18next.t(`commands:${this.asciiName}.description` as any);
      this._descriptionLocalization = {};
      availableLanguages().forEach(language => {
        if(i18next.language === language) return;
        const localized: string = i18next.t(`commands:${this.asciiName}.description` as any, { lng: language }).substring(0, 100);
        if(localized === this._description) return;
        this._descriptionLocalization[language as keyof typeof this._descriptionLocalization] = localized.trim();
      });

      this._examples = examples ? {} : null;
      if(this._examples){
        availableLanguages().forEach(language => {
          this._examples![language as keyof typeof this._examples]
            = i18next.t(`commands:${this.asciiName}.examples` as any, { lng: language }).trim();
        });
      }

      this._usage = usage ? {} : null;
      if(this._usage){
        availableLanguages().forEach(language => {
          this._usage![language as keyof typeof this._usage]
            = i18next.t(`commands:${this.asciiName}.usage` as any, { lng: language }).trim();
        });
      }

      this._category = category;

      this._argument = argument ? argument.map(arg => {
        const result: LocalizedSlashCommandArgument = {
          type: arg.type,
          name: arg.name,
          required: arg.required || false,
          description: i18next.t(`commands:${this.asciiName}.args.${arg.name}.description` as any),
          descriptionLocalization: {} as LocaleMap,
          choices: [],
          autoCompleteEnabled: arg.autoCompleteEnabled || false,
        };
        availableLanguages().forEach(language => {
          if(i18next.language === language) return;
          const localized: string = i18next.t(`commands:${this.asciiName}.args.${arg.name}.description` as any, { lng: language })
            .substring(0, 100);
          if(localized === result.description) return;
          result.descriptionLocalization[language as keyof typeof result.descriptionLocalization] = localized.trim();
        });

        arg.choices?.forEach(choiceValue => {
          const resultChoice = {
            name: i18next.t(`commands:${this.asciiName}.args.${arg.name}.choices.${choiceValue}` as any),
            value: choiceValue,
            nameLocalizations: {} as LocaleMap,
          };
          availableLanguages().forEach(language => {
            if(i18next.language === language) return;
            const localized = i18next.t(`commands:${this.asciiName}.args.${arg.name}.choices.${choiceValue}` as any, { lng: language });
            if(localized === resultChoice.name) return;
            resultChoice.nameLocalizations[language as keyof LocaleMap] = localized.trim();
          });
          result.choices!.push(resultChoice);
        });

        if(result.choices!.length === 0){
          delete result.choices;
        }

        return result;
      }) : null;

      this._requiredPermissionsOr = requiredPermissionsOr || [];
      this._defaultMemberPermission = defaultMemberPermission || "NONE";
    }
    this.logger = getLogger(`Command(${this.asciiName})`);
    this.logger.debug(`${this.name} loaded`);
  }

  /**ローカライズされた権限の説明を取得します */
  getLocalizedPermissionDescription(locale: string){
    const perms = this.requiredPermissionsOr.filter(perm => perm !== "admin");
    if(perms.length === 0){
      return i18next.t("none", { lng: locale });
    }else if(perms.length > 1){
      return i18next.t("permissions.eitherOf", {
        lng: locale,
        things: perms.map(permission => i18next.t(`permissions.${permission}`, { lng: locale })).join(", "),
      });
    }else{
      return i18next.t(`permissions.${perms[0]}`, { lng: locale });
    }
  }

  /** ローカライズされたコマンドの説明を取得します */
  getLocalizedDescription(locale: string){
    return i18next.t(`commands:${this.asciiName}.description` as any, { lng: locale });
  }

  /** 権限の確認と実行を一括して行います */
  async checkAndRun(message: CommandMessage, context: Readonly<CommandArgs>){
    const judgeIfPermissionMeeted: ((perm: CommandPermission) => boolean) = (perm: CommandPermission) => {
      switch(perm){
        case "admin":
          return discordUtil.users.isPrivileged(message.member);
        case "dj":
          return discordUtil.users.isDJ(message.member, context);
        case "manageGuild":
          return message.member.permissions.has("MANAGE_GUILD");
        case "manageMessages":
          return message.channel.permissionsOf(message.member).has("MANAGE_MESSAGES");
        case "noConnection":
          return !context.server.player.isConnecting;
        case "onlyListener":
          return discordUtil.channels.isOnlyListener(message.member, context);
        case "sameVc":
          return discordUtil.channels.sameVC(message.member, context);
        case "onlyBotInVc": {
          const member = discordUtil.channels.getVoiceMember(context);
          if(!member){
            return false;
          }
          return member.filter(m => !m.bot).length === 0;
        }
        default:
          return false;
      }
    };
    if(this.requiredPermissionsOr.length !== 0 && !this.requiredPermissionsOr.some(judgeIfPermissionMeeted)){
      await message.reply({
        content: `${context.includeMention ? `<@${message.member.id}> ` : ""}${i18next.t("permissions.needed", {
          permissions: this.getLocalizedPermissionDescription(context.locale),
          lng: context.locale,
        })}`,
        ephemeral: true,
        allowedMentions: {
          users: false,
        },
      });
      return;
    }

    // 遅延処理するべき時には遅延させる
    if(this.shouldDefer && message["_interaction"] && !message["_interaction"].acknowledged){
      if(message["_interaction"].type === InteractionTypes.APPLICATION_COMMAND){
        await message["_interaction"].defer();
      }else if(message["_interaction"].type === InteractionTypes.MESSAGE_COMPONENT){
        await message["_interaction"].deferUpdate();
      }
    }

    this.emit("run", context);
    await this.run(message, context, i18next.getFixedT(context.locale));
  }

  /** アプリケーションコマンドとして登録できるオブジェクトを生成します */
  toApplicationCommandStructure(): CreateApplicationCommandOptions[] {
    if(this.unlist) throw new Error("This command cannot be listed due to private command!");
    const result: CreateApplicationCommandOptions[] = [];
    const defaultMemberPermissions = this.defaultMemberPermission === "NONE"
      ? null
      : this.defaultMemberPermission.reduce((prev, current) => prev | Permissions[current], 0n).toString();

    // build options if any
    const options = this.argument?.map(arg => {
      const discordCommandStruct = {
        type: CommandManager.mapCommandOptionTypeToInteger(arg.type),
        name: arg.name,
        description: arg.description
          .replace(/\r/g, "")
          .replace(/\n/g, "")
          .substring(0, 100),
        descriptionLocalizations: Object.entries(arg.descriptionLocalization).length > 0 ? arg.descriptionLocalization : null,
        required: arg.required,
        choices: arg.choices?.map(choice => ({
          name: choice.name,
          value: choice.value,
          nameLocalizations: Object.entries(choice.nameLocalizations).length > 0 ? choice.nameLocalizations : null,
        })) as ApplicationCommandOptionsChoice[],
        autocomplete: arg.autoCompleteEnabled || false,
      } as ApplicationCommandOptionsString | ApplicationCommandOptionsInteger | ApplicationCommandOptionsBoolean;

      if("choices" in discordCommandStruct){
        delete discordCommandStruct.autocomplete;
      }else if("autocomplete" in discordCommandStruct){
        delete discordCommandStruct.choices;
      }

      return discordCommandStruct;
    });

    if(options && options.length > 0){
      result.push({
        type: ApplicationCommandTypes.CHAT_INPUT,
        name: this.asciiName,
        description: this.description
          .replace(/\r/g, "")
          .replace(/\n/g, "")
          .substring(0, 100),
        descriptionLocalizations: Object.entries(this.descriptionLocalization).length > 0 ? this.descriptionLocalization : null,
        options,
        defaultMemberPermissions,
      });
    }else{
      result.push({
        type: ApplicationCommandTypes.CHAT_INPUT,
        name: this.asciiName,
        description: this.description
          .replace(/\r/g, "")
          .replace(/\n/g, "")
          .substring(0, 100),
        descriptionLocalizations: Object.entries(this.descriptionLocalization).length > 0 ? this.descriptionLocalization : null,
        defaultMemberPermissions,
      });
    }

    if(this.messageCommand){
      const messageCommand = {
        type: ApplicationCommandTypes.MESSAGE as const,
        name: this.asciiName,
        nameLocalizations: {} as LocaleMap,
        defaultMemberPermissions,
      };
      availableLanguages().forEach(language => {
        messageCommand.nameLocalizations[language as keyof LocaleMap] = i18next.t(`commands:${this.asciiName}.messageCommandName` as any, { lng: language })!;
      });
      result.push(messageCommand);
    }

    return result;
  }
}
