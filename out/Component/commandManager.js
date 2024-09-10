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
exports.CommandManager = void 0;
const tslib_1 = require("tslib");
const util_1 = tslib_1.__importDefault(require("util"));
const i18next_1 = tslib_1.__importDefault(require("i18next"));
const oceanic_js_1 = require("oceanic.js");
const Structure_1 = require("../Structure");
const decorators_1 = require("../Util/decorators");
const config_1 = require("../config");
const definition_1 = require("../definition");
const i18n_1 = require("../i18n");
// const commandSeparator = "_";
/**
 * コマンドマネージャー
 */
// eslint-disable-next-line @typescript-eslint/ban-types
let CommandManager = (() => {
    var _a;
    let _classSuper = Structure_1.LogEmitter;
    let _instanceExtraInitializers = [];
    let _sync_decorators;
    return _a = class CommandManager extends _classSuper {
            /**
             * コマンドマネージャーの唯一のインスタンスを返します
             */
            static get instance() {
                return this._instance ??= new _a();
            }
            /** コマンドを返します */
            get commands() {
                return this._commands;
            }
            /** サブコマンドがあるコマンドの一覧を返します */
            get subCommandNames() {
                return this._subCommandNames;
            }
            constructor() {
                super("CommandsManager");
                this._commands = tslib_1.__runInitializers(this, _instanceExtraInitializers);
                this.logger.trace("Initializing");
                this._commands = require("../Commands/_index").default.filter(n => !n.disabled);
                this.initializeMap({ reportDupes: (0, config_1.getConfig)().debug });
                this.initializeSubcommandNames();
                this.logger.trace("Initialized");
            }
            initializeMap({ reportDupes }) {
                const sets = new Map();
                const setCommand = (name, command) => {
                    if (sets.has(name) && reportDupes && !command.interactionOnly) {
                        this.logger.warn(`Detected command ${command.name} the duplicated key ${name} with ${sets.get(name).name}; overwriting`);
                    }
                    sets.set(name, command);
                };
                this.commands.forEach(command => {
                    setCommand(command.name, command);
                    command.alias.forEach(name => setCommand(name, command));
                });
                this.commandMap = sets;
            }
            initializeSubcommandNames() {
                this._subCommandNames = new Set(this.commands
                    .filter(command => command.asciiName.includes(">"))
                    .map(command => command.asciiName.split(">")[0]));
            }
            /**
             * コマンド名でコマンドを解決します
             * @param command コマンド名
             * @returns 解決されたコマンド
             */
            resolve(command) {
                const result = this.commandMap.get(command.toLowerCase());
                if (result) {
                    this.logger.info(`Command "${command}" was resolved successfully`);
                }
                else {
                    this.logger.info("Command not found");
                }
                return result;
            }
            async sync(client, removeOutdated = false) {
                if (process.env.DISABLE_SYNC_SC && !removeOutdated) {
                    this.logger.info("Skip syncing commands");
                    return;
                }
                this.logger.info("Start syncing application commands");
                // format local commands into the api-compatible well-formatted ones
                const apiCompatibleCommands = this.groupSubcommands(this.commands
                    .filter(command => !command.unlist)
                    .flatMap(command => command.toApplicationCommandStructure())
                    .map(command => this.apiToApplicationCommand(command)));
                // Get registered commands
                const registeredAppCommands = await client.application.getGlobalCommands({ withLocalizations: true });
                this.logger.info(`Successfully get ${registeredAppCommands.length} commands registered.`);
                const commandsToEdit = await this.filterCommandsToBeEdited(apiCompatibleCommands, registeredAppCommands);
                const commandsToAdd = await this.filterCommandsToBeAdded(apiCompatibleCommands, registeredAppCommands);
                const commandsToRemove = await this.filterCommandsToBeRemoved(apiCompatibleCommands, registeredAppCommands);
                // if the app has the known commands or has no command and there are too many diffs, bulk-registering them
                if (commandsToEdit.length + commandsToAdd.length > 3 && (registeredAppCommands.length === 0 || commandsToRemove.length === 0)) {
                    this.logger.info("Bulk-registering application-commands");
                    await client.application.bulkEditGlobalCommands(apiCompatibleCommands);
                    this.logger.info("Successfully registered");
                    return;
                }
                // if there are any commands that should be added or updated
                if (commandsToEdit.length > 0 || commandsToAdd.length > 0) {
                    this.logger.info(`Detected ${commandsToEdit.length + commandsToAdd.length} commands that should be updated; updating`);
                    this.logger.info([...commandsToEdit, ...commandsToAdd].map(command => command.name));
                    for (let i = 0; i < commandsToEdit.length; i++) {
                        const commandToRegister = commandsToEdit[i];
                        const id = registeredAppCommands.find(cmd => cmd.type === commandToRegister.type && cmd.name === commandToRegister.name).id;
                        await client.application.editGlobalCommand(id, commandToRegister);
                        this.logger.info(`editing ${Math.floor((i + 1) / commandsToEdit.length * 1000) / 10}% completed`);
                    }
                    for (let i = 0; i < commandsToAdd.length; i++) {
                        const commandToRegister = commandsToAdd[i];
                        await client.application.createGlobalCommand(commandToRegister);
                        this.logger.info(`adding ${Math.floor((i + 1) / commandsToAdd.length * 1000) / 10}% completed`);
                    }
                    this.logger.info("Updating succeeded.");
                }
                else {
                    this.logger.info("Detected no command that should be updated");
                }
                // remove outdated commands (which are not recognized as the bot's command)
                if (removeOutdated) {
                    if (commandsToRemove.length > 0) {
                        this.logger.info(`Detected ${commandsToRemove.length} commands that should be removed; removing...`);
                        this.logger.info(commandsToRemove.map(command => command.name));
                        await client.application.bulkEditGlobalCommands(apiCompatibleCommands);
                        this.logger.info("Removal succeeded.");
                    }
                    else {
                        this.logger.info("Detected no command that should be removed");
                    }
                }
            }
            async filterCommandsToBeEdited(apiCompatibleCommands, registeredAppCommands) {
                return apiCompatibleCommands.filter(expected => {
                    if (expected.type === oceanic_js_1.ApplicationCommandTypes.CHAT_INPUT) {
                        const actual = registeredAppCommands.find(command => command.type === oceanic_js_1.ApplicationCommandTypes.CHAT_INPUT && command.name === expected.name);
                        if (!actual) {
                            return false;
                        }
                        else {
                            return !this.isSameCommand(actual, expected);
                        }
                    }
                    else if (expected.type === oceanic_js_1.ApplicationCommandTypes.MESSAGE) {
                        const actual = registeredAppCommands.find(command => command.type === oceanic_js_1.ApplicationCommandTypes.MESSAGE && command.name === expected.name);
                        if (!actual) {
                            return false;
                        }
                        else {
                            return !this.isSameCommand(actual, expected);
                        }
                    }
                    else {
                        return false;
                    }
                });
            }
            async filterCommandsToBeAdded(apiCompatibleCommands, registeredAppCommands) {
                return apiCompatibleCommands.filter(expected => {
                    if (expected.type === oceanic_js_1.ApplicationCommandTypes.CHAT_INPUT) {
                        return !registeredAppCommands.some(reg => reg.type === oceanic_js_1.ApplicationCommandTypes.CHAT_INPUT && reg.name === expected.name);
                    }
                    else if (expected.type === oceanic_js_1.ApplicationCommandTypes.MESSAGE) {
                        return !registeredAppCommands.some(reg => reg.type === oceanic_js_1.ApplicationCommandTypes.MESSAGE && reg.name === expected.name);
                    }
                    else {
                        return false;
                    }
                });
            }
            async filterCommandsToBeRemoved(apiCompatibleCommands, registeredAppCommands) {
                return registeredAppCommands.filter(registered => {
                    const index = apiCompatibleCommands.findIndex(command => registered.type === command.type && registered.name === command.name);
                    return index < 0;
                });
            }
            async removeAllApplicationCommand(client) {
                this.logger.info("Removing all application commands");
                await client.application.bulkEditGlobalCommands([]);
                this.logger.info("Successfully removed all application commands");
            }
            async removeAllGuildCommand(client, guildId) {
                this.logger.info("Removing all guild commands of " + guildId);
                await client.application.bulkEditGuildCommands(guildId, []);
                this.logger.info("Successfully removed all guild commands");
            }
            isSameCommand(actual, expected) {
                return util_1.default.isDeepStrictEqual(this.apiToApplicationCommand(actual), expected);
            }
            apiToApplicationCommand(apiCommand) {
                const defaultMemberPermissions = apiCommand.defaultMemberPermissions && typeof apiCommand.defaultMemberPermissions === "object"
                    ? apiCommand.defaultMemberPermissions.allow.toString()
                    : apiCommand.defaultMemberPermissions;
                if (apiCommand.type === oceanic_js_1.ApplicationCommandTypes.MESSAGE) {
                    return {
                        type: apiCommand.type,
                        name: apiCommand.name,
                        nameLocalizations: apiCommand.nameLocalizations,
                        defaultMemberPermissions,
                    };
                }
                else if (apiCommand.options) {
                    const optionMapper = (option) => {
                        if ("choices" in option && option.choices) {
                            return {
                                type: option.type,
                                name: option.name,
                                description: option.description,
                                descriptionLocalizations: option.descriptionLocalizations,
                                required: !!option.required,
                                choices: option.choices.map(choice => ({
                                    name: choice.name,
                                    value: choice.value,
                                    // @ts-expect-error
                                    nameLocalizations: choice.nameLocalizations || choice.name_localizations || null,
                                    // @ts-expect-error
                                    name_localizations: choice.nameLocalizations || choice.name_localizations || null,
                                })),
                            };
                        }
                        else {
                            return {
                                type: option.type,
                                name: option.name,
                                description: option.description,
                                descriptionLocalizations: option.descriptionLocalizations,
                                required: !!option.required,
                                autocomplete: "autocomplete" in option && option.autocomplete || false,
                            };
                        }
                    };
                    return {
                        type: apiCommand.type,
                        name: apiCommand.name,
                        description: apiCommand.description,
                        descriptionLocalizations: apiCommand.descriptionLocalizations || {},
                        defaultMemberPermissions,
                        options: apiCommand.options.map(option => {
                            if (option.type === oceanic_js_1.ApplicationCommandOptionTypes.SUB_COMMAND) {
                                return {
                                    description: option.description,
                                    descriptionLocalizations: option.descriptionLocalizations || {},
                                    name: option.name,
                                    type: option.type,
                                    options: option.options?.map(optionMapper),
                                };
                            }
                            else {
                                return optionMapper(option);
                            }
                        }),
                    };
                }
                else {
                    return {
                        type: apiCommand.type,
                        name: apiCommand.name,
                        description: apiCommand.description,
                        descriptionLocalizations: apiCommand.descriptionLocalizations,
                        defaultMemberPermissions,
                    };
                }
            }
            static mapCommandOptionTypeToInteger(type) {
                switch (type) {
                    case "bool":
                        return oceanic_js_1.ApplicationCommandOptionTypes.BOOLEAN;
                    case "integer":
                        return oceanic_js_1.ApplicationCommandOptionTypes.INTEGER;
                    case "string":
                        return oceanic_js_1.ApplicationCommandOptionTypes.STRING;
                    case "file":
                        return oceanic_js_1.ApplicationCommandOptionTypes.ATTACHMENT;
                }
            }
            /**サブコマンドをグループ化します。現時点では、ネストは一段階のみ対応しています。 */
            groupSubcommands(commands) {
                const subcommandGroups = new Map();
                const normalCommands = commands.filter(c => {
                    if (!c.name.includes(definition_1.subCommandSeparator) || c.type !== oceanic_js_1.ApplicationCommandTypes.CHAT_INPUT) {
                        return true;
                    }
                    const baseName = c.name.split(definition_1.subCommandSeparator)[0];
                    if (subcommandGroups.has(baseName)) {
                        subcommandGroups.get(baseName).from.push(c);
                    }
                    else {
                        subcommandGroups.set(baseName, { from: [c], to: null });
                    }
                    return false;
                });
                for (const key of subcommandGroups.keys()) {
                    const group = subcommandGroups.get(key);
                    if (group.from.some(c => c.name === key)) {
                        throw new Error("Top level command that has subcommands cannot be command itself.");
                    }
                    if (!group.to) {
                        group.to = {
                            type: oceanic_js_1.ApplicationCommandTypes.CHAT_INPUT,
                            name: key,
                            description: i18next_1.default.t(`commands:${key}.description`),
                            defaultMemberPermissions: group.from[0].defaultMemberPermissions,
                            descriptionLocalizations: {},
                            options: [],
                        };
                        (0, i18n_1.availableLanguages)().forEach(language => {
                            if (i18next_1.default.language === language)
                                return;
                            const localized = i18next_1.default.t(`commands:${key}.description`, { lng: language }).substring(0, 100);
                            if (localized === group.to.description)
                                return;
                            group.to.descriptionLocalizations[language] = localized.trim();
                        });
                    }
                    group.from.forEach(command => {
                        const subcommand = {
                            type: oceanic_js_1.ApplicationCommandOptionTypes.SUB_COMMAND,
                            name: command.name.substring(key.length + 1),
                            description: command.description,
                            descriptionLocalizations: command.descriptionLocalizations || {},
                            options: command.options,
                        };
                        group.to.options.push(subcommand);
                    });
                }
                return [...normalCommands, ...[...subcommandGroups.values()].map(d => d.to)];
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _sync_decorators = [decorators_1.measureTime];
            tslib_1.__esDecorate(_a, null, _sync_decorators, { kind: "method", name: "sync", static: false, private: false, access: { has: obj => "sync" in obj, get: obj => obj.sync }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a._instance = null,
        _a;
})();
exports.CommandManager = CommandManager;
//# sourceMappingURL=commandManager.js.map