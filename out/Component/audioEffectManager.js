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
exports.AudioEffectManager = exports.audioEffectNames = void 0;
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const Commands_1 = require("../Commands");
const Structure_1 = require("../Structure");
const color_1 = require("../Util/color");
exports.audioEffectNames = ["bassBoost", "reverb", "loudnessEq", "3d", "karaoke", "nightcore"];
const audioEffects = {
    bassBoost: {
        name: "Bass Boost",
        arg: "firequalizer=gain_entry='entry(31,4);entry(62,2.7);entry(125,0.6)'",
        shouldDisableVbr: false,
    },
    reverb: {
        name: "Reverb",
        arg: "aecho=1.0:0.7:20:0.5",
        shouldDisableVbr: false,
    },
    loudnessEq: {
        name: "Loudness Eq",
        arg: "loudnorm",
        shouldDisableVbr: true,
    },
    "3d": {
        name: "3D",
        arg: "apulsator=hz=0.125:amount=0.8",
        shouldDisableVbr: false,
    },
    karaoke: {
        name: "Karaoke",
        arg: "stereotools=mlev=0.1",
        shouldDisableVbr: false,
    },
    nightcore: {
        name: "Nightcore",
        arg: "asetrate=48000*1.2,aresample=48000,bass=g=5",
        shouldDisableVbr: false,
    },
};
class AudioEffectManager extends Structure_1.ServerManagerBase {
    constructor(parent) {
        super("EffectManager", parent);
        this.data = Object.fromEntries(exports.audioEffectNames.map(name => [name, false]));
    }
    toggle(effectName) {
        return this.data[effectName] = !this.data[effectName];
    }
    getEnabled(effectName) {
        return this.data[effectName];
    }
    export() {
        const effectArgs = [];
        let shouldDisableVbr = false;
        for (const effectName of exports.audioEffectNames) {
            if (this.data[effectName]) {
                const { arg, shouldDisableVbr: _shouldDisableVbr } = audioEffects[effectName];
                effectArgs.push(arg);
                shouldDisableVbr = shouldDisableVbr || _shouldDisableVbr;
            }
        }
        const args = effectArgs.length > 0 ? ["-af", effectArgs.join(",")] : [];
        return { args, shouldDisableVbr };
    }
    createEmbed(avatarUrl) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        const embed = new helper_1.MessageEmbedBuilder()
            .setTitle(`:cd:${t("commands:effect.effectControllPanel.title")}:microphone:`)
            .setDescription(t("commands:effect.effectControllPanel.description"))
            .setColor((0, color_1.getColor)("EFFECT"))
            .setFooter({ iconURL: avatarUrl, text: t("commands:effect.effectControllPanel.footer") });
        for (const effectName of exports.audioEffectNames) {
            const effect = audioEffects[effectName];
            embed.addField(effect.name, this.data[effectName] ? "⭕" : "❌", true);
        }
        return embed.toOceanic();
    }
    createMessageButtons(customIdMap) {
        const buttons = [];
        for (const effectName of exports.audioEffectNames) {
            const effect = audioEffects[effectName];
            buttons.push(new helper_1.MessageButtonBuilder()
                .setCustomId(customIdMap[effectName])
                .setStyle(this.data[effectName] ? "SUCCESS" : "SECONDARY")
                .setLabel(effect.name));
        }
        return buttons;
    }
}
exports.AudioEffectManager = AudioEffectManager;
//# sourceMappingURL=audioEffectManager.js.map