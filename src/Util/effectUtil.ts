import type { GuildDataContainer } from "../definition";
import { MessageActionRow, MessageButton, MessageEmbed } from "discord.js";
import { getColor } from "./colorUtil";

export const EffectsCustomIds = {
  Reload: "reload",
  BassBoost: "bass_boost",
  Reverb: "reverb",
  LoudnessEqualization: "loudness_eq",
}

export function getFFmpegEffectArgs(data:GuildDataContainer){
  const effect = [];
  if(data.EffectPrefs.BassBoost)
    effect.push("firequalizer=gain_entry='entry(80,6)'")
  if(data.EffectPrefs.Reverb)
    effect.push("aecho=1.0:0.7:20:0.5")
  if(data.EffectPrefs.LoudnessEqualization)
    effect.push("loudnorm")
  
  if(effect.length >= 1){
    return ["-af", effect.join(",")];
  }else{
    return [];
  }
}

export function getCurrentEffectPanel(avatarUrl:string, data:GuildDataContainer){
  const embed = new MessageEmbed()
    .setTitle(":cd:エフェクトコントロールパネル:microphone:")
    .setDescription("オーディオエフェクトの設定/解除することができます。\r\n・表示は古い情報であることがありますが、エフェクトを操作したとき、更新ボタンを押したときに更新されます。\r\n・エフェクトは次の曲から適用されます\r\n現在の曲に適用したい場合は、`頭出し`コマンドを使用してください\r\n")
    .addField("Bass Boost", data.EffectPrefs.BassBoost ? "⭕" : "❌", true)
    .addField("Reverb", data.EffectPrefs.Reverb ? "⭕" : "❌", true)
    .addField("Loudness Eq", data.EffectPrefs.LoudnessEqualization ? "⭕" : "❌", true)
    .setColor(getColor("EFFECT"))
    .setFooter({
      iconURL: avatarUrl,
      text:"エフェクトを選択してボタンを押してください"
    })
  ;
  const messageActions = new MessageActionRow()
    .addComponents([
        new MessageButton()
        .setCustomId("reload")
        .setStyle("PRIMARY")
        .setEmoji("🔁")
        .setLabel("更新")
      ,
        new MessageButton()
        .setCustomId("bass_boost")
        .setStyle(data.EffectPrefs.BassBoost ? "SUCCESS" : "SECONDARY")
        .setLabel("Bass Boost")
      ,
        new MessageButton()
        .setCustomId("reverb")
        .setStyle(data.EffectPrefs.Reverb ? "SUCCESS" : "SECONDARY")
        .setLabel("Reverb")
      ,
        new MessageButton()
        .setCustomId("loudness_eq")
        .setStyle(data.EffectPrefs.LoudnessEqualization ? "SUCCESS" : "SECONDARY")
        .setLabel("Loudness Eq")
    ]);
  ;
  return { embed, messageActions };
}