import { APIMessage } from "discord-api-types";
import { Client, CommandInteraction, EmojiIdentifierResolvable, Message, MessageEditOptions } from "discord.js";

export class InteractionMessage {
  private isMessage = false;
  private _interaction = null as CommandInteraction;
  private _message = null as Message;

  private constructor(){
    //
  }

  static fromMessage(message:Message){
    const me = new InteractionMessage();
    me.isMessage = true;
    me._message = message;
    return me;
  }

  static fromInteraction(client:Client, interaction:CommandInteraction, message:APIMessage){
    const me = new InteractionMessage();
    me.isMessage = false;
    me._interaction = interaction;
    me._message = new Message(client, message);
    return me;
  }

  static fromInteractionWithMessage(interaction:CommandInteraction, message:Message){
    const me = new InteractionMessage();
    me.isMessage = false;
    me._interaction = interaction;
    me._message = message;
    return me;
  }

  async edit(options:string|MessageEditOptions):Promise<InteractionMessage>{
    if(this.isMessage){
      let _opt = null as MessageEditOptions;
      if(typeof options === "string"){
        _opt = {
          content: options
        }
      }else{
        _opt = options;
      }
      const msg = await this._message.edit(Object.assign(_opt, {
        allowedMentions: {
          repliedUser: false
        }
      } as MessageEditOptions));
      return InteractionMessage.fromMessage(msg);
    }else{
      let _opt = null as (MessageEditOptions & { fetchReply: true});
      if(typeof options === "string"){
        _opt = {content: options, fetchReply:true}
      }else{
        _opt = {fetchReply: true};
        _opt = Object.assign(_opt, options);
      }
      const mes  = (await this._interaction.editReply(_opt));
      if(mes instanceof Message){
        return InteractionMessage.fromInteractionWithMessage(this._interaction, mes);
      }else{
        return InteractionMessage.fromInteraction(this._message.client, this._interaction, mes);
      }
    }
  }

  async delete(){
    await this._message.delete();
  }

  react(emoji:EmojiIdentifierResolvable){
    return this._message.react(emoji);
  }

  get content(){
    return this._message.content;
  }

  get author(){
    return this.isMessage ? this._message.author : this._interaction.user;
  }

  get member(){
    return this.isMessage ? this._message.member : this._interaction.guild.members.resolve(this._interaction.user.id);;
  }

  get channel(){
    return this._message.channel;
  }

  get guild(){
    return this._message.guild;
  }

  get reactions(){
    return this._message.reactions;
  }

  get url(){
    return this._message.url;
  }

  get createdTimestamp(){
    return this._message.createdTimestamp;
  }

  get createdAt(){
    return this._message.createdAt;
  }

  get id(){
    return this._message.id;
  }

  get channelId(){
    return this._message.channel.id;
  }

  get attachments(){
    return this._message.attachments;
  }
}