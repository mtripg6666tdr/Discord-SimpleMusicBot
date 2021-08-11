import { Message, MessageEmbed } from "discord.js";

type MessageEmbedsResolvable = MessageEmbed[]|((pagenum:number)=>MessageEmbed)|((pagenum:number)=>Promise<MessageEmbed>);
export class PageToggle {
  private _message:Message;
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

  static arrowRight = "➡️";
  static arrowLeft = "⬅️";
  static async init(msg:Message, embeds:MessageEmbedsResolvable, total?:number, current?:number):Promise<PageToggle>{
    const n = new PageToggle();
    n._message = msg;
    n._embeds = embeds;
    if(total){
      n._total = total;
    }
    if(current){
      n._current = current;
    }
    await n._message.react(this.arrowLeft);
    await n._message.react(this.arrowRight);
    return n;
  }

  static Organize(toggles:PageToggle[], min:number, forceRemovingUnfresh:string = null){
    const delIndex = [] as number[];
    for(let i = 0; i < toggles.length; i++){
      if(new Date().getTime() - toggles[i].Message.createdTimestamp >= min * 60 * 1000 || (forceRemovingUnfresh && toggles[i].IsFreshNecessary && toggles[i].Message.guild.id === forceRemovingUnfresh)){
        delIndex.push(i);
      }
    }
    delIndex.sort((a,b)=>b-a);
    delIndex.forEach(i => {
      toggles[i].Message.reactions.removeAll();
      toggles.splice(i, 1);
    });
  }

  async FlipPage(page:number){
    let embed = null as MessageEmbed;
    this._current = page;
    if(this._embeds instanceof Array){
      embed = (this._embeds as MessageEmbed[])[page]
    }else if(typeof this._embeds === "function"){
      embed = await (this._embeds as any)(page);
    }
    await this.Message.edit({content: this.Message.content ,embeds:[embed]});
  }

  SetFresh(isFreshNecessary:boolean){
    this.IsFreshNecessary = isFreshNecessary;
    return this;
  }
}