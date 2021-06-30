import { Client, GuildMember, Message, MessageEmbed, TextChannel } from "discord.js";
import * as ytdl from "ytdl-core";
import { AudioSource } from "../AudioSource/audiosource";
import { BestdoriApi, BestdoriS, exportableBestdori } from "../AudioSource/bestdori";
import { CustomStream, exportableCustom } from "../AudioSource/custom";
import { GoogleDrive } from "../AudioSource/googledrive";
import { Hibiki, HibikiApi } from "../AudioSource/hibiki";
import { exportableSoundCloud, SoundCloudS } from "../AudioSource/soundcloud";
import { exportableStreamable, Streamable, StreamableApi } from "../AudioSource/streamable";
import { exportableYouTube, YouTube } from "../AudioSource/youtube";
import { FallBackNotice, GuildVoiceInfo } from "../definition";
import { getColor } from "../Util/colorUtil";
import { CalcMinSec, isAvailableRawAudioURL, log } from "../Util/util";
import { ManagerBase } from "./ManagerBase";
import { PageToggle } from "./PageToggle";

/**
 * サーバーごとのキューを管理するマネージャー。
 * キューの追加および削除などの機能を提供します。
 */
export class QueueManager extends ManagerBase {
  // キューの本体
  private _default:QueueContent[] = [];
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
  get LengthSeconds():number{
    var totalLength = 0;
    this.default.forEach(q => totalLength += Number(q.BasicInfo.LengthSeconds));
    return totalLength;
  }

  constructor(){
    super();
    log("[QueueManager]Queue Manager instantiated");
  }

  SetData(data:GuildVoiceInfo){
    log("[QueueManager]Set data of guild id " + data.GuildID);
    super.SetData(data);
  }

  async AddQueue(
      url:string, 
      addedBy:GuildMember, 
      method:"push"|"unshift" = "push", 
      type:"youtube"|"custom"|"unknown" = "unknown", 
      gotData:exportableCustom = null
      ):Promise<QueueContent>{
    log("[QueueManager/" + this.info.GuildID + "]AddQueue() called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    const result = {
      BasicInfo:null,
      AdditionalInfo:{
        AddedBy: {
          userId: addedBy?.id ?? "0",
          displayName: addedBy?.displayName ?? "不明"
        }
      }
    } as QueueContent;
    
    if(type === "youtube" || (type === "unknown" && ytdl.validateURL(url))){
      // youtube
      result.BasicInfo = await new YouTube().init(url, gotData as exportableYouTube, this.length === 0 || method === "unshift" || this.LengthSeconds < 4 * 60 * 60 * 1000);
    }else if(type === "custom" || (type === "unknown" && isAvailableRawAudioURL(url))){
      // カスタムストリーム
      result.BasicInfo = await new CustomStream().init(url);
    }else if(type === "unknown"){
      // google drive
      if(url.match(/drive\.google\.com\/file\/d\/([^\/\?]+)(\/.+)?/)){
        result.BasicInfo = await new GoogleDrive().init(url);
      }else if(url.match(/https?:\/\/soundcloud.com\/.+\/.+/)){
        // soundcloud
        result.BasicInfo = await new SoundCloudS().init(url, gotData as exportableSoundCloud);
      }else if(StreamableApi.getVideoId(url)){
        // Streamable
        result.BasicInfo = await new Streamable().init(url, gotData as exportableStreamable);
      }else if(BestdoriApi.getAudioId(url)){
        // Bestdori
        result.BasicInfo = await new BestdoriS().init(url, gotData as exportableBestdori);
      }else if(HibikiApi.validateURL(url)){
        // Hibiki
        result.BasicInfo = await new Hibiki().init(url);
      }
    }
    if(result.BasicInfo){
      this._default[method](result);
      return result;
    }
    throw "Provided URL was not resolved as available service";
  }

  /**
   * ユーザーへのインタラクションやキュー追加までを一括して行います
   * @param client Botのクライアント
   * @param url 追加するソースのURL
   * @param addedBy 追加したユーザー
   * @param type 追加するURLのソースが判明している場合にはyoutubeまたはcustom、不明な場合はunknownを指定
   * @param first 最初に追加する場合はtrue、末尾に追加する場合はfalse
   * @param fromSearch 検索パネルの破棄を行うかどうか。検索パネルからのキュー追加の場合にはtrue、それ以外はfalse
   * @param channel 検索パネルからのキュー追加でない場合に、ユーザーへのインタラクションメッセージを送信するチャンネル。送信しない場合はnull
   * @param message 各インタラクションを上書きするメッセージが既にある場合はここにメッセージを指定します。それ以外の場合はnull
   * @param gotData すでにデータを取得していて新たにフェッチする必要がなくローカルでキューコンテンツをインスタンス化する場合はここにデータを指定します
   */
  async AutoAddQueue(
      client:Client, 
      url:string, 
      addedBy:GuildMember, 
      type:"youtube"|"custom"|"unknown",
      first:boolean = false, 
      fromSearch:boolean = false, 
      channel:TextChannel = null,
      message:Message = null,
      gotData:exportableCustom = null
      ){
    log("[QueueManager/" + this.info.GuildID + "]AutoAddQueue() Called");
    var ch:TextChannel = null;
    var msg:Message = null;
    try{
      if(fromSearch && this.info.SearchPanel){
        // 検索パネルから
        log("[QueueManager/" + this.info.GuildID + "]AutoAddQueue() From search panel");
        ch = await client.channels.fetch(this.info.SearchPanel.Msg.chId) as TextChannel;
        msg = await (ch as TextChannel).messages.fetch(this.info.SearchPanel.Msg.id);
        const tembed = new MessageEmbed();
        tembed.title = "お待ちください";
        tembed.description = "情報を取得しています...";
        msg.edit("", tembed);
      }else if(message){
        // すでに処理中メッセージがある
        log("[QueueManager/" + this.info.GuildID + "]AutoAddQueue() Interaction message specified");
        ch = message.channel as TextChannel;
        msg = message;
      }else if(channel){
        // まだないので生成
        log("[QueueManager/" + this.info.GuildID + "]AutoAddQueue() Interaction channel specified");
        ch = channel;
        msg = await channel.send("情報を取得しています。お待ちください...");
      }
      if(this.info.Queue.length > 999){
        // キュー上限
        log("[QueueManager/" + this.info.GuildID + "]AutoAddQueue() Failed since too long queue", "warn");
        throw "キューの上限を超えています";
      }
      const info = await this.info.Queue.AddQueue(url, addedBy, first ? "unshift" : "push", type, gotData ?? null);
      log("[QueueManager/" + this.info.GuildID + "]AutoAddQueue() Added successfully");
      if(msg){
        // 曲の時間取得＆計算
        const _t = Number(info.BasicInfo.LengthSeconds);
        const [min,sec] = CalcMinSec(_t);
        // キュー内のオフセット取得
        const index = first ? "0" : (this.info.Queue.length - 1).toString();
        // ETAの計算
        const [emin, esec] = CalcMinSec(this.LengthSeconds - _t - Math.floor(this.info.Manager.CurrentTime / 1000));
        const embed = new MessageEmbed()
          .setColor(getColor("SONG_ADDED"))
          .setTitle("✅曲が追加されました")
          .setDescription("[" + info.BasicInfo.Title + "](" + info.BasicInfo.Url + ")")
          .addField("長さ", ((info.BasicInfo.ServiceIdentifer === "youtube" && (info.BasicInfo as YouTube).LiveStream) ? "ライブストリーム" : (_t !== 0 ? min + ":" + sec : "不明")), true)
          .addField("リクエスト", addedBy?.displayName ?? "不明", true)
          .addField("キュー内の位置", index === "0" ? "再生中/再生待ち" : index, true)
          .addField("再生されるまでの予想時間", index === "0" ? "-" : (emin + ":" + esec))
          .setThumbnail(info.BasicInfo.Thumnail);
        if(info.BasicInfo.ServiceIdentifer === "youtube" && (info.BasicInfo as YouTube).IsFallbacked){
          embed.addField(":warning:注意", FallBackNotice);
        }
        await msg.edit("", embed);
      }
    }
    catch(e){
      log("[QueueManager/" + this.info.GuildID + "]AutoAddQueue() Failed");
      log(e, "error");
      if(msg){
        msg.edit(":weary: キューの追加に失敗しました。追加できませんでした。(" + e + ")").catch(e => log(e, "error"));
      }
    }
  }

  async Next(){
    log("[QueueManager/" + this.info.GuildID + "]Next() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    this.OnceLoopEnabled = false;
    this.info.Manager.errorCount = 0;
    this.info.Manager.errorUrl = "";
    if(this.QueueLoopEnabled){
      this.default.push(this.default[0]);
    }else{
      if(this.info.AddRelative && this.info.Manager.CurrentVideoInfo.ServiceIdentifer === "youtube"){
        const relatedVideos = (this.info.Manager.CurrentVideoInfo as YouTube).relatedVideos;
        if(relatedVideos.length >= 1){
          await this.info.Queue.AddQueue(relatedVideos[0].url, null, "push", "youtube", relatedVideos[0]);
        }
      }
    }
    this._default.shift();
  }

  RemoveAt(offset:number){
    log("[QueueManager/" + this.info.GuildID + "]RemoveAt() Called (offset:" + offset + ")");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    this._default.splice(offset, 1);
  }

  RemoveAll(){
    log("[QueueManager/" + this.info.GuildID + "]RemoveAll() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    this._default = [];
  }

  RemoveFrom2(){
    log("[QueueManager/" + this.info.GuildID + "]RemoveFrom2() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    this._default = [this.default[0]];
  }

  Shuffle(){
    log("[QueueManager/" + this.info.GuildID + "]Shuffle() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    if(this._default.length === 0) return;
    if(this.info.Manager.IsPlaying){
      const first = this._default[0];
      this._default.shift();
      this._default.sort(() => Math.random() - 0.5);
      this._default.unshift(first);
    }else{
      this._default.sort(() => Math.random() - 0.5);
    }
  }

  RemoveIf(validator:(q:QueueContent)=>Boolean){
    log("[QueueManager/" + this.info.GuildID + "]RemoveIf() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    if(this._default.length === 0) return;
    const first = this.info.Manager.IsPlaying ? 1 : 0
    const rmIndex = [] as number[];
    for(var i = first; i < this._default.length; i++){
      if(validator(this._default[i])){
        rmIndex.push(i);
      }
    }
    rmIndex.forEach(n => this.RemoveAt(n));
    return rmIndex;
  }

  Move(from:number, to:number){
    log("[QueueManager/" + this.info.GuildID + "]Move() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    if(from < to){
      //要素追加
      this.default.splice(to + 1, 0, this.default[from]);
      //要素削除
      this.default.splice(from, 1);
    }else if(from > to){
      //要素追加
      this.default.splice(to, 0, this.default[from]);
      //要素削除
      this.default.splice(from + 1, 1);
    }
  }
}

/**
 * キューの内容を示します
 */
type QueueContent = {
  /**
   * 曲自体のメタ情報
   */
  BasicInfo:AudioSource;
  /**
   * 曲の情報とは別の追加情報
   */
  AdditionalInfo:AdditionalInfo;
}

/**
 * 曲の情報とは別の追加情報を示します。
 */
type AdditionalInfo = {
  /**
   * 曲の追加者を示します
   */
  AddedBy:{
    /**
     * 曲の追加者の表示名。表示名は追加された時点での名前になります。
     */
    displayName:string,
    /**
     * 曲の追加者のユーザーID
     */
    userId:string
  }
}
