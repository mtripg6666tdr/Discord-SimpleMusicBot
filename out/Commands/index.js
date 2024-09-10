"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommand = exports.commandExecutionContext = void 0;
exports.getCommandExecutionContext = getCommandExecutionContext;
const tslib_1 = require("tslib");
const async_hooks_1 = require("async_hooks");
const i18next_1 = tslib_1.__importDefault(require("i18next"));
const oceanic_js_1 = require("oceanic.js");
const commandManager_1 = require("../Component/commandManager");
const Util_1 = require("../Util");
const i18n_1 = require("../i18n");
const logger_1 = require("../logger");
exports.commandExecutionContext = new async_hooks_1.AsyncLocalStorage();
function getCommandExecutionContext() {
    return exports.commandExecutionContext.getStore() ?? {
        t: i18next_1.default.t,
    };
}
/**
 * すべてのコマンドハンドラーの基底クラスです
 */
class BaseCommand extends oceanic_js_1.TypedEmitter {
    // eslint-disable-next-line unused-imports/no-unused-vars
    handleAutoComplete(argname, input, otherOptions) {
        return [];
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    async handleModalSubmitInteraction(interaction, server) {
    }
    get name() {
        return this._name;
    }
    get alias() {
        return this._alias;
    }
    get description() {
        return this._description;
    }
    get unlist() {
        return this._unlist;
    }
    get examples() {
        return this._examples;
    }
    get usage() {
        return this._usage;
    }
    get category() {
        return this._category;
    }
    get shouldDefer() {
        return this._shouldDefer;
    }
    get argument() {
        return this._argument;
    }
    get requiredPermissionsOr() {
        return this._requiredPermissionsOr || [];
    }
    get descriptionLocalization() {
        return this._descriptionLocalization;
    }
    get disabled() {
        return this._disabled;
    }
    get messageCommand() {
        return this._messageCommand;
    }
    get interactionOnly() {
        return this._interactionOnly;
    }
    get defaultMemberPermission() {
        return this._defaultMemberPermission;
    }
    /** スラッシュコマンドの名称として登録できる旧基準を満たしたコマンド名を取得します */
    get asciiName() {
        return this.alias.filter(c => c.match(/^[>\w-]{2,32}$/))[0];
    }
    constructor(opts) {
        super();
        this._shouldDefer = false;
        this._disabled = false;
        this._messageCommand = false;
        this._interactionOnly = false;
        this._defaultMemberPermission = "NONE";
        this._messageCommand = "messageCommand" in opts && opts.messageCommand || false;
        this._interactionOnly = "interactionOnly" in opts && opts.interactionOnly || false;
        this._alias = opts.alias;
        this._name = "name" in opts
            ? opts.name
            : this._interactionOnly
                ? opts.alias[0]
                : i18next_1.default.t(`commands:${this.asciiName}.name`);
        this._unlist = opts.unlist;
        this._shouldDefer = opts.shouldDefer;
        this._disabled = opts.disabled || false;
        if (!this._unlist) {
            if (!this.asciiName) {
                throw new Error("Command has not ascii name");
            }
            const { examples, usage, category, args, requiredPermissionsOr, defaultMemberPermission, } = opts;
            this._description = i18next_1.default.t(`commands:${this.asciiName}.description`);
            this._descriptionLocalization = {};
            (0, i18n_1.availableLanguages)().forEach(language => {
                if (i18next_1.default.language === language)
                    return;
                const localized = i18next_1.default.t(`commands:${this.asciiName}.description`, { lng: language }).substring(0, 100);
                if (localized === this._description)
                    return;
                this._descriptionLocalization[language] = localized.trim();
            });
            this._examples = examples ? {} : null;
            if (this._examples) {
                (0, i18n_1.availableLanguages)().forEach(language => {
                    this._examples[language]
                        = i18next_1.default.t(`commands:${this.asciiName}.examples`, { lng: language }).trim();
                });
            }
            this._usage = usage ? {} : null;
            if (this._usage) {
                (0, i18n_1.availableLanguages)().forEach(language => {
                    this._usage[language]
                        = i18next_1.default.t(`commands:${this.asciiName}.usage`, { lng: language }).trim();
                });
            }
            this._category = category;
            this._argument = args ? args.map(arg => {
                const result = {
                    type: arg.type,
                    name: arg.name,
                    required: arg.required || false,
                    description: i18next_1.default.t(`commands:${this.asciiName}.args.${arg.name}.description`),
                    descriptionLocalization: {},
                    choices: [],
                    autoCompleteEnabled: arg.autoCompleteEnabled || false,
                };
                (0, i18n_1.availableLanguages)().forEach(language => {
                    if (i18next_1.default.language === language)
                        return;
                    const localized = i18next_1.default.t(`commands:${this.asciiName}.args.${arg.name}.description`, { lng: language })
                        .substring(0, 100);
                    if (localized === result.description)
                        return;
                    result.descriptionLocalization[language] = localized.trim();
                });
                arg.choices?.forEach(choiceValue => {
                    const resultChoice = {
                        name: i18next_1.default.t(`commands:${this.asciiName}.args.${arg.name}.choices.${choiceValue}`),
                        value: choiceValue,
                        nameLocalizations: {},
                    };
                    (0, i18n_1.availableLanguages)().forEach(language => {
                        if (i18next_1.default.language === language)
                            return;
                        const localized = i18next_1.default.t(`commands:${this.asciiName}.args.${arg.name}.choices.${choiceValue}`, { lng: language });
                        if (localized === resultChoice.name)
                            return;
                        resultChoice.nameLocalizations[language] = localized.trim();
                    });
                    result.choices.push(resultChoice);
                });
                if (result.choices.length === 0) {
                    delete result.choices;
                }
                return result;
            }) : null;
            this._requiredPermissionsOr = requiredPermissionsOr || [];
            this._defaultMemberPermission = defaultMemberPermission || "NONE";
        }
        this.logger = (0, logger_1.getLogger)(`Command(${this.asciiName})`);
        this.logger.debug(`${this.name} loaded`);
    }
    /**ローカライズされた権限の説明を取得します */
    getLocalizedPermissionDescription(locale) {
        const perms = this.requiredPermissionsOr.filter(perm => perm !== "admin");
        if (perms.length === 0) {
            return i18next_1.default.t("none", { lng: locale });
        }
        else if (perms.length > 1) {
            return i18next_1.default.t("permissions.eitherOf", {
                lng: locale,
                things: perms.map(permission => i18next_1.default.t(`permissions.${permission}`, { lng: locale })).join(", "),
            });
        }
        else {
            return i18next_1.default.t(`permissions.${perms[0]}`, { lng: locale });
        }
    }
    /** ローカライズされたコマンドの説明を取得します */
    getLocalizedDescription(locale) {
        return i18next_1.default.t(`commands:${this.asciiName}.description`, { lng: locale });
    }
    /** 権限の確認と実行を一括して行います */
    async checkAndRun(message, context) {
        const judgeIfPermissionMeeted = (perm) => {
            switch (perm) {
                case "admin":
                    return Util_1.discordUtil.users.isPrivileged(message.member);
                case "dj":
                    return Util_1.discordUtil.users.isDJ(message.member, context);
                case "manageGuild":
                    return message.member.permissions.has("MANAGE_GUILD");
                case "manageMessages":
                    return message.channel.permissionsOf(message.member).has("MANAGE_MESSAGES");
                case "noConnection":
                    return !context.server.player.isConnecting;
                case "onlyListener":
                    return Util_1.discordUtil.channels.isOnlyListener(message.member, context);
                case "sameVc":
                    return Util_1.discordUtil.channels.sameVC(message.member, context);
                case "onlyBotInVc": {
                    const member = Util_1.discordUtil.channels.getVoiceMember(context);
                    if (!member) {
                        return false;
                    }
                    return member.filter(m => !m.bot).length === 0;
                }
                default:
                    return false;
            }
        };
        if (this.requiredPermissionsOr.length !== 0 && !this.requiredPermissionsOr.some(judgeIfPermissionMeeted)) {
            await message.reply({
                content: `${context.includeMention ? `<@${message.member.id}> ` : ""}${i18next_1.default.t("permissions.needed", {
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
        if (this.shouldDefer && message["_interaction"] && !message["_interaction"].acknowledged) {
            if (message["_interaction"].type === oceanic_js_1.InteractionTypes.APPLICATION_COMMAND) {
                await message["_interaction"].defer();
            }
            else if (message["_interaction"].type === oceanic_js_1.InteractionTypes.MESSAGE_COMPONENT) {
                await message["_interaction"].deferUpdate();
            }
        }
        this.emit("run", context);
        await exports.commandExecutionContext.run(context, () => this.run(message, context));
    }
    /** アプリケーションコマンドとして登録できるオブジェクトを生成します */
    toApplicationCommandStructure() {
        if (this.unlist) {
            throw new Error("This command cannot be listed due to private command!");
        }
        const result = [];
        const defaultMemberPermissions = this.defaultMemberPermission === "NONE"
            ? null
            : this.defaultMemberPermission.reduce((prev, current) => prev | oceanic_js_1.Permissions[current], 0n).toString();
        // build options if any
        const options = this.argument?.map(arg => {
            const discordCommandStruct = {
                type: commandManager_1.CommandManager.mapCommandOptionTypeToInteger(arg.type),
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
                })),
                autocomplete: arg.autoCompleteEnabled || false,
            };
            if ("choices" in discordCommandStruct) {
                delete discordCommandStruct.autocomplete;
            }
            else if ("autocomplete" in discordCommandStruct) {
                delete discordCommandStruct.choices;
            }
            return discordCommandStruct;
        });
        if (options && options.length > 0) {
            result.push({
                type: oceanic_js_1.ApplicationCommandTypes.CHAT_INPUT,
                name: this.asciiName,
                description: this.description
                    .replace(/\r/g, "")
                    .replace(/\n/g, "")
                    .substring(0, 100),
                descriptionLocalizations: Object.entries(this.descriptionLocalization).length > 0 ? this.descriptionLocalization : null,
                options,
                defaultMemberPermissions,
            });
        }
        else {
            result.push({
                type: oceanic_js_1.ApplicationCommandTypes.CHAT_INPUT,
                name: this.asciiName,
                description: this.description
                    .replace(/\r/g, "")
                    .replace(/\n/g, "")
                    .substring(0, 100),
                descriptionLocalizations: Object.entries(this.descriptionLocalization).length > 0 ? this.descriptionLocalization : null,
                defaultMemberPermissions,
            });
        }
        if (this.messageCommand) {
            const messageCommand = {
                type: oceanic_js_1.ApplicationCommandTypes.MESSAGE,
                name: this.asciiName,
                nameLocalizations: {},
                defaultMemberPermissions,
            };
            (0, i18n_1.availableLanguages)().forEach(language => {
                messageCommand.nameLocalizations[language] = i18next_1.default.t(`commands:${this.asciiName}.messageCommandName`, { lng: language });
            });
            result.push(messageCommand);
        }
        return result;
    }
}
exports.BaseCommand = BaseCommand;
BaseCommand.updateBoundChannel = function updateBoundChannel(originalMethod, _context) {
    return function replacementMethodUpdateBoundChannel(...args) {
        args[1].server.updateBoundChannel(args[0]);
        return originalMethod.apply(this, args);
    };
};
//# sourceMappingURL=index.js.map