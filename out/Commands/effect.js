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
const tslib_1 = require("tslib");
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const _1 = require(".");
const audioEffectManager_1 = require("../Component/audioEffectManager");
let Effect = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class Effect extends _classSuper {
            constructor() {
                super({
                    alias: ["effect", "音声エフェクト", "音声効果", "効果"],
                    unlist: false,
                    category: "player",
                    requiredPermissionsOr: [],
                    shouldDefer: false,
                });
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                const { t } = context;
                try {
                    const { collector, customIdMap } = context.server.bot.collectors.create()
                        .setAuthorIdFilter(message.member.id)
                        .setMaxInteraction(Infinity)
                        .setTimeout(5 * 60 * 1000)
                        .createCustomIds(Object.fromEntries([
                        ["reload", "button"],
                        ...audioEffectManager_1.audioEffectNames.map(name => [name, "button"]),
                    ]));
                    const createActionRow = () => {
                        const rows = [];
                        const components = [
                            new helper_1.MessageButtonBuilder()
                                .setCustomId(customIdMap.reload)
                                .setStyle("PRIMARY")
                                .setEmoji("🔁")
                                .setLabel(t("commands:effect.effectControllPanel.reload")),
                            ...context.server.audioEffects.createMessageButtons(customIdMap),
                        ];
                        for (let i = 0; i < Math.ceil(components.length / 5); i++) {
                            rows.push(new helper_1.MessageActionRowBuilder()
                                .addComponents(...components.slice(i * 5, (i + 1) * 5))
                                .toOceanic());
                        }
                        return rows;
                    };
                    const reply = await message.reply({
                        embeds: [context.server.audioEffects.createEmbed(message.member.avatarURL())],
                        components: createActionRow(),
                    });
                    const updateEffectEmbed = (emptyrow = false) => {
                        reply.edit({
                            embeds: [context.server.audioEffects.createEmbed(message.member.avatarURL())],
                            components: emptyrow ? [] : createActionRow(),
                        }).catch(this.logger.error);
                    };
                    collector.on("reload", () => updateEffectEmbed());
                    collector.on("timeout", () => updateEffectEmbed(true));
                    for (const effectName of audioEffectManager_1.audioEffectNames) {
                        collector.on(effectName, () => {
                            context.server.audioEffects.toggle(effectName);
                            updateEffectEmbed();
                        });
                    }
                }
                catch (e) {
                    this.logger.error(e);
                    message.reply(`:cry:${t("errorOccurred")}`).catch(this.logger.error);
                }
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _run_decorators = [(_b = _1.BaseCommand).updateBoundChannel.bind(_b)];
            tslib_1.__esDecorate(_a, null, _run_decorators, { kind: "method", name: "run", static: false, private: false, access: { has: obj => "run" in obj, get: obj => obj.run }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.default = Effect;
//# sourceMappingURL=effect.js.map