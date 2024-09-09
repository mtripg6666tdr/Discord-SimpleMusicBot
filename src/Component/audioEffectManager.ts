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

import type { GuildDataContainer } from "../Structure";

import { MessageButtonBuilder, MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { getCommandExecutionContext } from "../Commands";
import { ServerManagerBase } from "../Structure";
import { getColor } from "../Util/color";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface EffectManagerEvents {
}

export const audioEffectNames = ["bassBoost", "reverb", "loudnessEq", "3d", "karaoke", "nightcore"] as const;
export type AudioEffectNames = (typeof audioEffectNames)[number];

type AudioEffect = {
  name: string,
  arg: string,
  shouldDisableVbr: boolean,
};

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
} as const satisfies Record<AudioEffectNames, AudioEffect>;

export type ExportedAudioEffect = {
  args: string[],
  shouldDisableVbr: boolean,
};

export class AudioEffectManager extends ServerManagerBase<EffectManagerEvents> {
  constructor(parent: GuildDataContainer) {
    super("EffectManager", parent);
  }

  protected data: Record<AudioEffectNames, boolean> = Object.fromEntries(
    audioEffectNames.map(name => [name, false])
  ) as Record<AudioEffectNames, boolean>;

  toggle(effectName: AudioEffectNames) {
    return this.data[effectName] = !this.data[effectName];
  }

  getEnabled(effectName: AudioEffectNames) {
    return this.data[effectName];
  }

  export(): ExportedAudioEffect {
    const effectArgs: string[] = [];
    let shouldDisableVbr = false;
    for (const effectName of audioEffectNames) {
      if (this.data[effectName]) {
        const { arg, shouldDisableVbr: _shouldDisableVbr } = audioEffects[effectName];
        effectArgs.push(arg);
        shouldDisableVbr = shouldDisableVbr || _shouldDisableVbr;
      }
    }

    const args = effectArgs.length > 0 ? ["-af", effectArgs.join(",")] : [];

    return { args, shouldDisableVbr };
  }

  createEmbed(avatarUrl: string) {
    const { t } = getCommandExecutionContext();

    const embed = new MessageEmbedBuilder()
      .setTitle(`:cd:${t("commands:effect.effectControllPanel.title")}:microphone:`)
      .setDescription(t("commands:effect.effectControllPanel.description"))
      .setColor(getColor("EFFECT"))
      .setFooter({ iconURL: avatarUrl, text: t("commands:effect.effectControllPanel.footer") });

    for (const effectName of audioEffectNames) {
      const effect = audioEffects[effectName];
      embed.addField(effect.name, this.data[effectName] ? "⭕" : "❌", true);
    }

    return embed.toOceanic();
  }

  createMessageButtons(customIdMap: Record<AudioEffectNames, string>) {
    const buttons: MessageButtonBuilder[] = [];
    for (const effectName of audioEffectNames) {
      const effect = audioEffects[effectName];
      buttons.push(
        new MessageButtonBuilder()
          .setCustomId(customIdMap[effectName])
          .setStyle(this.data[effectName] ? "SUCCESS" : "SECONDARY")
          .setLabel(effect.name)
      );
    }
    return buttons;
  }
}
