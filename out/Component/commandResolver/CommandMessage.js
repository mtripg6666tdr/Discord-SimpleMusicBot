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
exports.CommandMessage = void 0;
const oceanic_command_resolver_1 = require("@mtripg6666tdr/oceanic-command-resolver");
const oceanic_command_resolver_2 = require("@mtripg6666tdr/oceanic-command-resolver");
const Util_1 = require("../../Util");
const definition_1 = require("../../definition");
const commandManager_1 = require("../commandManager");
oceanic_command_resolver_2.defaultConfig.subCommandSeparator = definition_1.subCommandSeparator;
class CommandMessage extends oceanic_command_resolver_1.CommandMessage {
    // 超省略形を解釈するために、基底クラスをオーバーライドします
    static parseCommand(content, prefixLength) {
        const resolved = super.parseCommand(content, prefixLength, Util_1.normalizeText);
        // 超省略形を捕捉
        if (resolved.command.startsWith("http")) {
            resolved.options.push(resolved.command);
            resolved.rawOptions = resolved.command;
            resolved.command = "play";
        }
        return resolved;
    }
    // サブコマンドを解決するために、基底クラスをオーバーライドします
    static createFromMessage(message, prefixLength) {
        const resolved = this.parseCommand(message.content, prefixLength || 1);
        if (commandManager_1.CommandManager.instance.subCommandNames.has(resolved.command)) {
            const subCommand = resolved.options.shift();
            if (subCommand) {
                resolved.command = `${resolved.command}${definition_1.subCommandSeparator}${subCommand}`;
                resolved.rawOptions = resolved.options.join(" ");
            }
        }
        return CommandMessage.createFromMessageWithParsed(message, resolved.command, resolved.options, resolved.rawOptions);
    }
}
exports.CommandMessage = CommandMessage;
//# sourceMappingURL=CommandMessage.js.map