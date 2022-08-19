import type { ResponseMessage } from "./ResponseMessage";
import type { MessageComponentInteraction, MessageEmbed } from "discord.js";

import { MessageActionRow, MessageButton } from "discord.js";

/**
 * 最終的にメッセージの埋め込みに解決されるデータ
 */
type MessageEmbedsResolvable = MessageEmbed[]|((pagenum:number)=>MessageEmbed)|((pagenum:number)=>Promise<MessageEmbed>);

/**
 * リアクションによってページめくりができるメッセージの管理を行います
 */
export class PageToggle {
  private _message:ResponseMessage;
  get Message(){
    return this._message;
  }

  private _embeds:MessageEmbedsResolvable;
  get Embeds(){
    return this._embeds;
  }

  private _current:number = 0;
  get Current(){
    return this._current;
  }

  private _total:number = -1;
  get Length(){
    return this._embeds instanceof Array ? (this.Embeds as MessageEmbed[]).length : this._total === -1 ? NaN : this._total;
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
      content: n._message.content === "" ? null : n._message.content,
      embeds: n._message.embeds,
      components: [
        new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId(this.arrowLeft)
              .setLabel(this.arrowLeftEmoji)
              .setStyle("PRIMARY"),
            new MessageButton()
              .setCustomId(this.arrowRight)
              .setLabel(this.arrowRightEmoji)
              .setStyle("PRIMARY")
          )
      ]
    });
    return n;
  }

  static Organize(toggles:PageToggle[], min:number, forceRemovingUnfresh:string = null){
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

  async FlipPage(page:number, interaction?:MessageComponentInteraction){
    let embed = null as MessageEmbed;
    this._current = page;
    if(this._embeds instanceof Array){
      embed = (this._embeds as MessageEmbed[])[page];
    }else if(typeof this._embeds === "function"){
      embed = await (this._embeds as any)(page);
    }
    if(interaction){
      await interaction.editReply({
        content: this.Message.content === "" ? null : this.Message.content,
        embeds: [embed]
      });
    }else{
      await this.Message.edit({
        content: this.Message.content === "" ? null : this.Message.content,
        embeds: [embed]
      });
    }
  }

  SetFresh(isFreshNecessary:boolean){
    this.IsFreshNecessary = isFreshNecessary;
    return this;
  }
}
