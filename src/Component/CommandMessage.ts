import { APIMessage } from "discord-api-types";
import { CommandInteraction, Message, TextChannel, MessageOptions, EmojiIdentifierResolvable, Client, Collection, MessageAttachment } from "discord.js";
import { GuildVoiceInfo } from "../definition";
import { log, NormalizeText } from "../Util/util";

/**
 * メッセージによるコマンド実行と、スラッシュコマンドによるコマンド実行による差を吸収します
 * @remarks このクラスは、従来の様式でのコマンドの処理コードをそのまま使えるようにするものであり非常によくないコードです
 */
export class CommandMessage {
  private isMessage = false;
  private _channel = null as TextChannel;
  private _message = null as Message;
  private _responseMes = null as Message;
  private _interaction = null as CommandInteraction;
  private client = null as Client;
  private constructor(){
    //
  }

  static fromMessage(message:Message){
    const me = new CommandMessage();
    me.isMessage = true;
    me._message = message;
    me._channel = message.channel as TextChannel;
    return me;
  }

  static fromInteraction(interaction:CommandInteraction, client:Client){
    const me = new CommandMessage();
    me.isMessage = false;
    me._interaction = interaction;
    if(!interaction.deferred){
      interaction.deferReply();
    }
    me.client = client;
    return me;
  }

  /**
   * 応答メッセージを作成します
   * @param options 
   * @returns 
   */
  async send(options:string|MessageOptions):Promise<CommandMessage>{
    if(this.isMessage){
      const me = this._responseMes ? CommandMessage.fromMessage(this._message) : this;
      me._responseMes = await this._channel.send(options);
      return me;
    }else{
      let _opt = null as (MessageOptions & { fetchReply: true});
      if(typeof options === "string"){
        _opt = {content: options, fetchReply:true}
      }else{
        _opt = {fetchReply: true};
        _opt = Object.assign(_opt, options);
      }
      const mes  = (await this._interaction.editReply(_opt));
      if(mes instanceof Message){
        this._responseMes = mes;
      }else{
        this._responseMes = new Message(this.client, mes);
      }
      return this;
    }
  }

  /**
   * 応答メッセージを編集します
   * @param options 
   * @returns 
   */
  edit(options:string|MessageOptions):Promise<Message|APIMessage>{
    if(this.isMessage){
      if(this._responseMes){
        return this._responseMes.edit(options);
      }else{
        throw new Error("Cannot edit a message that hasn't been sent yet.");
      }
    }else{
      if(this._interaction.replied){
        return this._interaction.editReply(options);
      }else{
        throw new Error("Cannot edit a reply that hasn't been sent yet.");
      }
    }
  }

  /**
   * 応答メッセージを削除します
   * @returns 
   */
  delete():Promise<Message|void>{
    if(this.isMessage){
      if(this._responseMes){
        return this._responseMes.delete();
      }else{
        throw new Error("Cannot delete a message that hasn't been sent yet.");
      }
    }else{
      if(this._interaction.replied){
        return this._interaction.deleteReply();
      }else{
        throw new Error("Cannot delete a reply that hasn't been sent yet.");
      }
    }
  }

  /**
   * 応答メッセージにリアクションを付けます
   * @param emoji 
   * @returns 
   */
  react(emoji:EmojiIdentifierResolvable){
    if(this.isMessage){
      return this._responseMes.react(emoji);
    }else{
      return this._responseMes.react(emoji);
    }
  }
  
  /**
   * コマンドメッセージの埋め込みを削除します
   * @param suppress 
   * @returns 
   */
  async suppressEmbeds(suppress:boolean):Promise<Message|void>{
    if(this.isMessage){
      return this._message.suppressEmbeds(suppress);
    }else{
      return;
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
    if(this.isMessage){
      return this._message.author;
    }else{
      return this._interaction.user;
    }
  }

  /**
   * コマンドメッセージの作成メンバーを取得します
   */
  get member(){
    if(this.isMessage){
      return this._message.member;
    }else{
      return this._interaction.guild.members.resolve(this._interaction.user);
    }
  }

  /**
   * これ自身を返します
   * 互換性のために残されています。
   */
  get channel(){
    return this;
  }

  /**
   * コマンドメッセージのサーバーを取得します
   */
  get guild(){
    if(this.isMessage){
      return this._message.guild;
    }else{
      return this._interaction.guild;
    }
  }

  /**
   * 応答メッセージのリアクションを取得します
   */
  get reactions(){
    return this._responseMes?.reactions;
  }

  /**
   * 応答メッセージのURLを取得します
   */
  get url(){
    return this._responseMes.url;
  }

  /**
   * 応答メッセージの作成されたタイムスタンプを取得します
   */
  get createdTimestamp(){
    return this._responseMes?.createdTimestamp;
  }

  /**
   * コマンドメッセージの作成されたデートタイムを返します
   */
  get createdAt(){
    if(this.isMessage){
      return this._message.createdAt;
    }else{
      return this._interaction.createdAt;
    }
  }

  /**
   * 応答メッセージのIDを取得します
   */
  get id(){
    return this._responseMes?.id;
  }
  
  /**
   * コマンドメッセージのチャンネルIDを取得します
   */
  get channelId(){
    if(this.isMessage){
      return this._message.channel.id;
    }else{
      return this._interaction.channelId;
    }
  }

  /**
   * コマンドメッセージの添付ファイルを取得します
   */
  get attachments(){
    if(this.isMessage){
      return this._message.attachments;
    }else{
      return new Collection<string, MessageAttachment>();
    }
  }

  static resolveCommandMessage(content:string, guildid:string, data:{[key:string]:GuildVoiceInfo}){
    const msg_spl = NormalizeText(content).substr(1, content.length - 1).split(" ");
    let command = msg_spl[0];
    let rawOptions = msg_spl.length > 1 ? content.substring(command.length + (data[guildid] ? data[guildid].PersistentPref.Prefix : ">").length + 1, content.length) : "";
    let options = msg_spl.length > 1 ? msg_spl.slice(1, msg_spl.length) : [];
    
    log("[Main/" + guildid + "]Command Prefix detected: " + content);
    
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