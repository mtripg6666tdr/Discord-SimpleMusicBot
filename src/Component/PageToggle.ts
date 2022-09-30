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

import type { ResponseMessage } from "./ResponseMessage";
import type { ComponentInteraction, EmbedOptions } from "eris";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

/**
 * 最終的にメッセージの埋め込みに解決されるデータ
 */
type MessageEmbedsResolvable = EmbedOptions[]|((pagenum:number)=>EmbedOptions)|((pagenum:number)=>Promise<EmbedOptions>);

/**
 * リアクションによってページめくりができるメッセージの管理を行います
 */
export class PageToggle {
  private _message:ResponseMessage;
  get Message(){
    return this._message;
  }

  private _embeds:MessageEmbedsResolvable;
  get embeds(){
    return this._embeds;
  }

  private _current:number = 0;
  get Current(){
    return this._current;
  }

  private _total:number = -1;
  get Length(){
    return Array.isArray(this._embeds) ? this._embeds.length : this._total === -1 ? NaN : this._total;
  }

  IsFreshNecessary = false;

  private constructor(){}

  static arrowRightEmoji = "▶";
  static arrowLeftEmoji = "◀";
  static arrowRight = "flip_page_next";
  static arrowLeft = "flip_page_prev";
  static async init(msg:ResponseMessage, embeds:MessageEmbedsResolvable, total?:number, current?:number):Promise<PageToggle>{
    const n = new PageToggle();
    n._message = await msg.fetch();
    n._embeds = embeds;
    if(total){
      n._total = total;
    }
    if(current){
      n._current = current;
    }
    await n._message.edit({
      content: n._message.content,
      embeds: n._message.embeds,
      components: [
        new Helper.MessageActionRowBuilder()
          .addComponents(
            new Helper.MessageButtonBuilder()
              .setCustomId(this.arrowLeft)
              .setLabel(this.arrowLeftEmoji)
              .setStyle("PRIMARY"),
            new Helper.MessageButtonBuilder()
              .setCustomId(this.arrowRight)
              .setLabel(this.arrowRightEmoji)
              .setStyle("PRIMARY")
          )
          .toEris()
      ]
    });
    return n;
  }

  static organize(toggles:PageToggle[], min:number, forceRemovingUnfresh:string = null){
    const delIndex = [] as number[];
    for(let i = 0; i < toggles.length; i++){
      if(new Date().getTime() - toggles[i].Message.createdTimestamp >= min * 60 * 1000 || (forceRemovingUnfresh && toggles[i].IsFreshNecessary && toggles[i].Message.guild.id === forceRemovingUnfresh)){
        delIndex.push(i);
      }
    }
    delIndex.sort((a, b)=>b - a);
    delIndex.forEach(i => {
      toggles[i].Message.edit({
        content: toggles[i].Message.content === "" ? null : toggles[i].Message.content,
        embeds: toggles[i].Message.embeds,
        components: []
      });
      toggles.splice(i, 1);
    });
  }

  async flipPage(page:number, interaction?:ComponentInteraction){
    let embed = null as EmbedOptions;
    this._current = page;
    if(this._embeds instanceof Array){
      embed = this._embeds[page];
    }else if(typeof this._embeds === "function"){
      embed = await this._embeds(page);
    }
    if(interaction){
      await interaction.editOriginalMessage({
        content: this.Message.content,
        embeds: [embed],
      });
    }else{
      await this.Message.edit({
        content: this.Message.content,
        embeds: [embed],
      });
    }
  }

  setFresh(isFreshNecessary:boolean){
    this.IsFreshNecessary = isFreshNecessary;
    return this;
  }
}
