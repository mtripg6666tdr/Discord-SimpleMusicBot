import { CommandInteraction, Message, MessageOptions, Client, Collection, MessageAttachment, ReplyMessageOptions } from "discord.js";
import { GuildDataContainer } from "../definition";
import { NormalizeText, timer } from "../Util";
import { ResponseMessage } from "./ResponseMessage";

/**
 * ユーザーが送信するコマンドを含むメッセージまたはインタラクションを表します
 */
export class CommandMessage {
  private isMessage = false;
  private _message = null as Message;
  private _interaction = null as CommandInteraction;
  private _interactionReplied = false;
  private _client = null as Client;
  private _command = null as string;
  private _options = null as string[];
  private _rawOptions = null as string;
  private _responseMessage = null as ResponseMessage;
  private constructor(){
    //
  }

  /**
   * オブジェクトをメッセージオブジェクトで初期化します
   * @param message ユーザーが送信するコマンドを含むメッセージ
   * @returns 新しいCommandMessageのインスタンス
   */
  static createFromMessage(message:Message){
    const me = new CommandMessage();
    me.isMessage = true;
    me._message = message;
    const { command, options, rawOptions } = this.resolveCommandMessage(message.content);
    me._command = command;
    me._options = options;
    me._rawOptions = rawOptions;
    return me;
  }

  private static createFromMessageWithParsed(message:Message, command:string, options:string[], rawOptions:string){
    const me = new CommandMessage();
    me.isMessage = true;
    me._message = message;
    me._command = command;
    me._options = options;
    me._rawOptions = rawOptions;
    return me;
  }

  /**
   * オブジェクトをインタラクションで初期化します
   * @param client ボットのクライアント
   * @param interaction ユーザーが送信するコマンドを含むインタラクション
   * @returns 新しいCommandMessageのインスタンス
   */
  static createFromInteraction(client:Client, interaction:CommandInteraction){
    const me = new CommandMessage();
    me.isMessage = false;
    me._interaction = interaction;
    if(!interaction.deferred){
      interaction.deferReply();
    }
    me._client = client;
    me._command = interaction.commandName;
    me._options = interaction.options.data.map(arg => arg.value.toString());
    me._rawOptions = me._options.join(" ");
    return me;
  }

  /**
   * コマンドに応答します
   * @param options 応答メッセージの本体
   * @returns 応答するメッセージのInteractionMessage
   */
  async reply(options:string|MessageOptions):Promise<ResponseMessage>{
    const t = timer.start("CommandMessage#reply");
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
      const result = this._responseMessage = ResponseMessage.createFromMessage(msg, this);
      t.end();
      return result;
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
        this._responseMessage = ResponseMessage.createFromInteractionWithMessage(this._interaction, mes, this);
        t.end();
        return this._responseMessage;
      }else{
        this._responseMessage = ResponseMessage.createFromInteraction(this._client, this._interaction, mes, this);
        t.end();
        return this._responseMessage;
      }
    }
  }

  /**
   * 対応する応答メッセージを返します
   * @remarks 応答メッセージは最新のものとは限りません
   */
  get response():ResponseMessage{
    return this._responseMessage;
  }
  
  /**
   * コマンドメッセージの埋め込みを削除します
   * @param suppress 
   * @returns 
   */
  async suppressEmbeds(suppress:boolean):Promise<CommandMessage>{
    if(this.isMessage){
      return CommandMessage.createFromMessageWithParsed(await this._message.suppressEmbeds(suppress), this._command, this._options, this._rawOptions);
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

  /**
   * コマンドメッセージのリアクションを取得します
   */
  get reactions(){
    return this.isMessage ? this._message.reactions : null;
  }

  /**
   * コマンドメッセージのURLを取得します。
   * インタラクションによるコマンド送信の場合URLが存在しないためnullとなります。
   */
  get url(){
    return this.isMessage ? this._message.url : null;
  }

  /**
   * コマンドメッセージの作成されたタイムスタンプを取得します
   */
  get createdTimestamp(){
    return this.isMessage ? this._message.createdTimestamp : this._interaction.createdTimestamp;
  }

  /**
   * コマンドメッセージの作成されたデートタイムを取得します
   */
  get createdAt(){
    return this.isMessage ? this._message.createdAt : this._interaction.createdAt;
  }

  /**
   * コマンドメッセージのIDを取得します
   */
  get id(){
    return this.isMessage ? this._message.id : this._interaction.id;
  }

  /**
   * コマンドメッセージのチャンネルIDを取得します
   */
  get channelId(){
    return this.isMessage ? this._message.channel.id : this._interaction.channel.id;
  }

  /**
   * コマンドメッセージの添付ファイルを取得します
   */
  get attachments(){
    return this.isMessage ? this._message.attachments : new Collection<string, MessageAttachment>();
  }
  
  /**
   * コマンド名を取得します
   */
  get command(){
    return this._command;
  }

  /**
   * 引数一覧を取得します
   */
  get options(){
    return this._options;
  }

  /**
   * 生の引数を取得します
   */
  get rawOptions(){
    return this._rawOptions;
  }

  /**
   * メッセージの内容からコマンド名や引数を解決します
   * @param content 内容
   * @param guildid サーバーID
   * @param data GuildVoiceInfoのデータ
   * @returns 解決されたコマンド名、パース済み引数、生の引数を含むオブジェクト
   */
  static resolveCommandMessage(content:string, prefixLength:number = 1){
    const parseCommand = (cmd:string) => {
      const commandString = NormalizeText(cmd).substring(1);
      let [command, ...options] = commandString.split(" ").filter(content => content.length > 0);
      let rawOptions = options.join(" ");
      return {command, options, rawOptions};
    };
    let { command, options, rawOptions } = parseCommand(content);

    // 超省略形を捕捉
    if(command.startsWith("http")){
      rawOptions = command;
      options.push(rawOptions);
      command = "play";
    }
    command = command.toLowerCase();
    return {
      command: command, 
      rawOptions: rawOptions, 
      options: options
    };
  }
}