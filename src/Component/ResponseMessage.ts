import { APIMessage } from "discord-api-types";
import { Client, CommandInteraction, EmojiIdentifierResolvable, Message, MessageEditOptions } from "discord.js";

/**
 * CommandMessageに対するボットの応答メッセージを表します
 */
export class ResponseMessage {
  private isMessage = false;
  private _interaction = null as CommandInteraction;
  private _message = null as Message;

  private constructor(){
    //
  }

  /**
   * オブジェクトをメッセージオブジェクトで初期化します
   * @param message 応答メッセージ本体
   * @returns 新しいInteractionMessageのインスタンス
   */
  static createFromMessage(message:Message){
    const me = new ResponseMessage();
    me.isMessage = true;
    me._message = message;
    return me;
  }

  /**
   * オブジェクトをインタラクションで初期化します
   * @param client ボットのクライアント
   * @param interaction ユーザーが送信するコマンドを含むインタラクション
   * @param message 応答メッセージ
   * @returns 新しいInteractionMessageのインスタンス
   */
  static createFromInteraction(client:Client, interaction:CommandInteraction, message:APIMessage){
    const me = new ResponseMessage();
    me.isMessage = false;
    me._interaction = interaction;
    me._message = new Message(client, message);
    return me;
  }

  /**
   * オブジェクトをインタラクションで初期化します
   * @param client ボットのクライアント
   * @param interaction ユーザーが送信するコマンドを含むインタラクション
   * @param message 応答メッセージ
   * @returns 新しいInteractionMessageのインスタンス
   */
  static createFromInteractionWithMessage(interaction:CommandInteraction, message:Message){
    const me = new ResponseMessage();
    me.isMessage = false;
    me._interaction = interaction;
    me._message = message;
    return me;
  }

  /**
   * 応答メッセージを編集します
   * @param options 応答メッセージの内容
   * @returns 編集後のInteractionMessage
   */
  async edit(options:string|MessageEditOptions):Promise<ResponseMessage>{
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
      return ResponseMessage.createFromMessage(msg);
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
        return ResponseMessage.createFromInteractionWithMessage(this._interaction, mes);
      }else{
        return ResponseMessage.createFromInteraction(this._message.client, this._interaction, mes);
      }
    }
  }

  /**
   * 応答メッセージを削除します
   */
  async delete(){
    await this._message.delete();
  }

  /**
   * 応答メッセージにリアクションします
   * @param emoji リアクションの内容
   * @returns メッセージリアクション
   */
  react(emoji:EmojiIdentifierResolvable){
    return this._message.react(emoji);
  }

  /**
   * 応答メッセージの内容を取得します
   */
  get content(){
    return this._message.content;
  }

  /**
   * 応答メッセージの作成したユーザーを取得します
   */
  get author(){
    return this.isMessage ? this._message.author : this._interaction.user;
  }

  /**
   * 応答メッセージの作成したメンバーを取得します
   */
  get member(){
    return this.isMessage ? this._message.member : this._interaction.guild.members.resolve(this._interaction.user.id);;
  }
  
  /**
   * 応答メッセージの送信されたチャンネルを取得します
   */
  get channel(){
    return this._message.channel;
  }

  /**
   * 応答メッセージの送信されたサーバーを取得します
   */
  get guild(){
    return this._message.guild;
  }

  /**
   * 応答メッセージのリアクションを取得します
   */
  get reactions(){
    return this._message.reactions;
  }

  /**
   * 応答メッセージのURLを取得します
   */
  get url(){
    return this._message.url;
  }

  /**
   * 応答メッセージの作成されたタイムスタンプを取得します
   */
  get createdTimestamp(){
    return this._message.createdTimestamp;
  }

  /**
   * 応答メッセージの作成されたデートタイムを取得します
   */
  get createdAt(){
    return this._message.createdAt;
  }

  /**
   * 応答メッセージのIDを取得します
   */
  get id(){
    return this._message.id;
  }

  /**
   * 応答メッセージのチャンネルIDを取得します
   */
  get channelId(){
    return this._message.channel.id;
  }

  /**
   * 応答メッセージの添付ファイルを取得します
   */
  get attachments(){
    return this._message.attachments;
  }

  /**
   * 応答メッセージの埋め込みを取得します
   */
  get embeds(){
    return this._message.embeds;
  }

  /**
   * 応答メッセージのコンポーネントを取得します
   */
  get components(){
    return this._message.components;
  }

  async fetch(){
    return this.isMessage ? ResponseMessage.createFromMessage(await this._message.fetch()) : ResponseMessage.createFromInteractionWithMessage(this._interaction, await this._message.fetch());
  }
}