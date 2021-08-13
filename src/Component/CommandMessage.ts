import { CommandInteraction, Message, MessageOptions, Client, Collection, MessageAttachment, ReplyMessageOptions } from "discord.js";
import { GuildVoiceInfo } from "../definition";
import { log, NormalizeText } from "../Util/util";
import { InteractionMessage } from "./InteractionMessage";

/**
 * メッセージによるコマンド実行と、スラッシュコマンドによるコマンド実行による差を吸収します
 * @remarks このクラスは、従来の様式でのコマンドの処理コードをそのまま使えるようにするものであり非常によくないコードです
 */
export class CommandMessage {
  private isMessage = false;
  private _message = null as Message;
  private _interaction = null as CommandInteraction;
  private _interactionReplied = false;
  private _client = null as Client;
  private constructor(){
    //
  }

  static fromMessage(message:Message){
    const me = new CommandMessage();
    me.isMessage = true;
    me._message = message;
    return me;
  }

  static fromInteraction(client:Client, interaction:CommandInteraction){
    const me = new CommandMessage();
    me.isMessage = false;
    me._interaction = interaction;
    if(!interaction.deferred){
      interaction.deferReply();
    }
    me._client = client;
    return me;
  }

  /**
   * メッセージに応答します
   * @param options 
   * @returns 
   */
  async reply(options:string|MessageOptions):Promise<InteractionMessage>{
    if(this.isMessage){
      let _opt = null as ReplyMessageOptions;
      if(typeof options === "string"){
        _opt = {
          content: options
        }
      }else{
        _opt = options;
      }
      const msg = await this._message.reply(Object.assign(_opt, {
        allowedMentions: {
          repliedUser: false
        }
      } as ReplyMessageOptions));
      return InteractionMessage.fromMessage(msg);
    }else{
      if(this._interactionReplied){
        throw new Error("すでに返信済みです");
      }
      let _opt = null as (MessageOptions & { fetchReply: true});
      if(typeof options === "string"){
        _opt = {content: options, fetchReply:true}
      }else{
        _opt = {fetchReply: true};
        _opt = Object.assign(_opt, options);
      }
      const mes  = (await this._interaction.editReply(_opt));
      this._interactionReplied = true;
      if(mes instanceof Message){
        return InteractionMessage.fromInteractionWithMessage(this._interaction, mes);
      }else{
        return InteractionMessage.fromInteraction(this._client, this._interaction, mes);
      }
    }
  }
  
  /**
   * コマンドメッセージの埋め込みを削除します
   * @param suppress 
   * @returns 
   */
  async suppressEmbeds(suppress:boolean):Promise<CommandMessage>{
    if(this.isMessage){
      return CommandMessage.fromMessage(await this._message.suppressEmbeds(suppress));
    }else{
      return this;
    }
  }

  /**
   * コマンドメッセージの内容を取得します
   */
  get content(){
    if(this.isMessage){
      return this._message.content;
    }else{
      return ("/" + this._interaction.commandName + " " + this._interaction.options.data.map(option => option.value).join(" ")).trim();
    }
  }

  /**
   * コマンドメッセージの作成ユーザーを取得します
   */
  get author(){
    return this.isMessage ? this._message.author : this._interaction.user;
  }

  /**
   * コマンドメッセージの作成メンバーを取得します
   */
  get member(){
    return this.isMessage ? this._message.member : this._interaction.guild.members.resolve(this._interaction.user.id);
  }

  get channel(){
    return this.isMessage ? this._message.channel : this._interaction.channel;
  }

  /**
   * コマンドメッセージのサーバーを取得します
   */
  get guild(){
    return this.isMessage ? this._message.guild : this._interaction.guild;
  }

  get reactions(){
    return this.isMessage ? this._message.reactions : null;
  }

  get url(){
    return this.isMessage ? this._message.url : null;
  }

  get createdTimestamp(){
    return this.isMessage ? this._message.createdTimestamp : this._interaction.createdTimestamp;
  }

  get createdAt(){
    return this.isMessage ? this._message.createdAt : this._interaction.createdAt;
  }

  get id(){
    return this.isMessage ? this._message.id : this._interaction.id;
  }

  get channelId(){
    return this.isMessage ? this._message.channel.id : this._interaction.channel.id;
  }

  /**
   * コマンドメッセージの添付ファイルを取得します
   */
  get attachments(){
    return this.isMessage ? this._message.attachments : new Collection<string, MessageAttachment>();
  }

  static resolveCommandMessage(content:string, guildid:string, data:{[key:string]:GuildVoiceInfo}){
    const msg_spl = NormalizeText(content).substr(1, content.length - 1).split(" ");
    let command = msg_spl[0];
    let rawOptions = msg_spl.length > 1 ? content.substring(command.length + (data[guildid] ? data[guildid].PersistentPref.Prefix : ">").length + 1, content.length) : "";
    let options = msg_spl.length > 1 ? msg_spl.slice(1, msg_spl.length) : [];
    
    // 超省略形を捕捉
    if(command.startsWith("http")){
      rawOptions = command;
      options.push(rawOptions);
      command = "p";
    }
    command = command.toLowerCase();
    return {
      command: command, 
      rawOptions: rawOptions, 
      options: options
    };
  }
}