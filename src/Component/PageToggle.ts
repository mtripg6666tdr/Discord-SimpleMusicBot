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

import type { ResponseMessage } from "./ResponseMessage";
import type { ComponentInteraction, EmbedOptions } from "oceanic.js";

import { MessageActionRowBuilder, MessageButtonBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { CommandMessage } from "./CommandMessage";

/**
 * 最終的にメッセージの埋め込みに解決されるデータ
 */
type MessageEmbedsResolvable = EmbedOptions[]|((pagenum: number) => EmbedOptions)|((pagenum: number) => Promise<EmbedOptions>);

/**
 * リアクションによってページめくりができるメッセージの管理を行います
 */
export class PageToggle {
  private _message: ResponseMessage;
  get Message(){
    return this._message;
  }

  private _embeds: MessageEmbedsResolvable;
  get embeds(){
    return this._embeds;
  }

  private _current: number = 0;
  get Current(){
    return this._current;
  }

  private _total: number = -1;
  get Length(){
    return Array.isArray(this._embeds) ? this._embeds.length : this._total === -1 ? NaN : this._total;
  }

  IsFreshNecessary = false;

  private constructor(){}

  static arrowRightEmoji = "▶";
  static arrowLeftEmoji = "◀";
  static arrowRight = "flip_page_next";
  static arrowLeft = "flip_page_prev";

  static async init(msg: CommandMessage|ResponseMessage, embeds: MessageEmbedsResolvable, total?: number, current?: number): Promise<PageToggle>{
    const n = new PageToggle();
    n._embeds = embeds;
    if(total){
      n._total = total;
    }
    if(current){
      n._current = current;
    }
    const apply:(CommandMessage["reply"]|ResponseMessage["edit"]) = msg instanceof CommandMessage ? msg.reply.bind(msg) : msg.edit.bind(msg);
    n._message = await apply({
      embeds: [
        await n.getEmbed(current || 0),
      ],
      components: [
        new MessageActionRowBuilder()
          .addComponents(
            new MessageButtonBuilder()
              .setCustomId(this.arrowLeft)
              .setEmoji(this.arrowLeftEmoji)
              .setStyle("PRIMARY"),
            new MessageButtonBuilder()
              .setCustomId(this.arrowRight)
              .setEmoji(this.arrowRightEmoji)
              .setStyle("PRIMARY")
          )
          .toOceanic(),
      ],
    });
    return n;
  }

  static organize(toggles: PageToggle[], min: number, forceRemovingUnfresh: string = null){
    const delIndex = [] as number[];
    for(let i = 0; i < toggles.length; i++){
      if(new Date().getTime() - toggles[i].Message.createdTimestamp.getTime() >= min * 60 * 1000 || forceRemovingUnfresh && toggles[i].IsFreshNecessary && toggles[i].Message.guild.id === forceRemovingUnfresh){
        delIndex.push(i);
      }
    }
    delIndex.sort((a, b)=>b - a);
    delIndex.forEach(i => {
      toggles[i].Message.edit({
        components: [],
      });
      toggles.splice(i, 1);
    });
  }

  async flipPage(page: number, interaction?: ComponentInteraction){
    this._current = page;
    const embed = await this.getEmbed(page);
    if(interaction){
      await interaction.editOriginal({
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

  protected getEmbed(page: number){
    if(Array.isArray(this._embeds)){
      return this._embeds[page];
    }else if(typeof this._embeds === "function"){
      return this._embeds(page);
    }
    return null;
  }

  setFresh(isFreshNecessary: boolean){
    this.IsFreshNecessary = isFreshNecessary;
    return this;
  }
}
