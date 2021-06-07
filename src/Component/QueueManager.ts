import { Client, Guild, GuildMember, Message, MessageEmbed, TextChannel} from "discord.js";
import * as ytdl from "ytdl-core";
import { AudioSource } from "../AudioSource/audiosource";
import { BestdoriApi, BestdoriS } from "../AudioSource/bestdori";
import { CustomStream } from "../AudioSource/custom";
import { GoogleDrive } from "../AudioSource/googledrive";
import { SoundCloudS } from "../AudioSource/soundcloud";
import { Streamable, StreamableApi } from "../AudioSource/streamable";
import { YouTube, ytdata } from "../AudioSource/youtube";
import { bestdori, GuildVoiceInfo } from "../definition";
import { CalcMinSec, log } from "../util";

export class QueueManager {
  // キューの本体
  private _default:QueueContent[] = [];
  // 親ノード
  private info:GuildVoiceInfo = null;
  // キューの本体のゲッタープロパティ
  get default():QueueContent[] {
    return this._default;
  }
  // トラックループが有効か?
  LoopEnabled:boolean = false;
  // キューループが有効か?
  QueueLoopEnabled:boolean = false;
  // ワンスループが有効か?
  OnceLoopEnabled:boolean = false;
  // キューの長さ
  get length():number {
    return this.default.length;
  }

  constructor(){

  }

  SetData(data:GuildVoiceInfo){
    log("[QueueManager]Set data of guild id " + data.GuildID)
    if(this.info) throw "すでに設定されています";
    this.info = data;
  }

  async AddQueue(url:string, addedBy:GuildMember, method:"push"|"unshift" = "push", type:"youtube"|"custom"|"unknown" = "unknown", gotData:ytdata = null):Promise<QueueContent>{
    const result = {
      BasicInfo:null,
      AdditionalInfo:{
        AddedBy: {
          userId: addedBy.id,
          displayName: addedBy.displayName
        }
      }
    } as QueueContent;
    if(type === "youtube" || (type === "unknown" && ytdl.validateURL(url))){
      // youtube
      if(gotData){
        result.BasicInfo = await new YouTube().initFromData(gotData.url, gotData.title, gotData.description, gotData.length, gotData.channel, gotData.thumbnail, gotData.isLive);
      }else{
        result.BasicInfo = await new YouTube().init(url)
      }
      this._default[method](result);
      return result;
    }else if(type === "unknown"){
      // google drive
      if(url.match(/drive\.google\.com\/file\/d\/([^\/\?]+)(\/.+)?/)){
        result.BasicInfo = await new GoogleDrive().init(url);
        this._default[method](result);
        return result;
      }else if(url.match(/https?:\/\/soundcloud.com\/.+\/.+/)){
        // soundcloud
        result.BasicInfo = await new SoundCloudS().init(url);
        this._default[method](result);
        return result;
      }else if(StreamableApi.getVideoId(url)){
        result.BasicInfo = await new Streamable().init(url);
        this._default[method](result);
        return result;
      }else if(BestdoriApi.getAudioId(url)){
        result.BasicInfo = await new BestdoriS().init(url);
        this._default[method](result);
        return result;
      }
    }
    // カスタムストリーム
    result.BasicInfo = await new CustomStream().init(url);
    this._default[method](result);
    return result;
  }

  /**
   * ユーザーへのインタラクションやキュー追加までを一括して行います
   * @param client Botのクライアント
   * @param url 追加するソースのURL
   * @param addedBy 追加したユーザー
   * @param type 追加するURLのソースが判明している場合にはyoutubeまたはcustom、不明な場合はunknownを指定
   * @param first 最初に追加する場合はtrue、末尾に追加する場合はfalse
   * @param fromSearch 検索パネルの破棄を行うかどうか。検索パネルからのキュー追加の場合にはtrue、それ以外はfalse
   * @param channel 検索パネルからのキュー追加でない場合に、ユーザーへのインタラクションメッセージを送信するチャンネル。送信しない場合はnull,
   * @param gotData YouTubeの場合にすでにデータを取得している場合はここにデータを指定します
   */
  async AutoAddQueue(
      client:Client, 
      url:string, 
      addedBy:GuildMember, 
      type:"youtube"|"custom"|"unknown",
      first:boolean=false, 
      fromSearch:boolean = false, 
      channel:TextChannel = null,
      gotData:ytdata = null
      ){
    var ch:TextChannel = null;
    var msg:Message = null;
    try{
      if(fromSearch && this.info.SearchPanel){
        ch = await client.channels.fetch(this.info.SearchPanel.Msg.chId) as TextChannel;
        msg= await (ch as TextChannel).messages.fetch(this.info.SearchPanel.Msg.id);
        msg.edit("お待ちください...", {embed:{description: "お待ちください..."}});
      }else if(channel){
        ch = channel;
        msg = await channel.send("お待ちください...");
      }
      const info = 
      gotData ? await this.info.Queue.AddQueue(url, addedBy, first ? "unshift" : "push", type, gotData)
        : await this.info.Queue.AddQueue(url, addedBy, first ? "unshift" : "push", type);
      if(msg){
        const embed = new MessageEmbed();
        embed.title = "✅曲が追加されました";
        embed.description = "[" + info.BasicInfo.Title + "](" + info.BasicInfo.Url + ")";
        const [min,sec] = CalcMinSec(Number(info.BasicInfo.LengthSeconds));
        embed.addField("長さ", ((info.BasicInfo.ServiceIdentifer === "youtube" && (info.BasicInfo as YouTube).LiveStream) ? "(ライブストリーム)" : min + ":" + sec), true);
        embed.addField("リクエスト", addedBy.displayName, true);
        const index = first ? "0" : (this.info.Queue.length - 1).toString();
        embed.addField("キュー内の位置", index === "0" ? "再生中/再生待ち" : index, true);
        embed.thumbnail = {
          url: info.BasicInfo.Thumnail
        };
        await msg.edit("", embed);
      }
    }
    catch(e){
      log(e, "error");
      if(msg){
        msg.edit(":weary: キューの追加に失敗しました。追加できませんでした。").catch(e => log(e, "error"));
      }
    }
  }

  Next(){
    this.OnceLoopEnabled = false;
    if(this.QueueLoopEnabled){
      this.default.push(this.default[0]);
    }
    this._default.shift();
  }

  RemoveAt(offset:number){
    this._default.splice(offset, 1);
  }

  RemoveAll(){
    this._default = [];
  }

  RemoveFrom2(){
    this._default = [this.default[0]];
  }

  Shuffle(){
    if(this._default.length === 0) return;
    const first = this._default[0];
    this._default.shift();
    this._default.sort(() => Math.random() - 0.5);
    this._default.unshift(first);
  }
}

type QueueContent = {
  BasicInfo:AudioSource;
  AdditionalInfo:AdditionalInfo;
}

type AdditionalInfo = {
  AddedBy:{
    displayName:string,
    userId:string
  }
}