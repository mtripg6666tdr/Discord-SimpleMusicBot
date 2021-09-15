import { Client, GuildMember, Message, MessageEmbed, TextChannel } from "discord.js";
import * as ytdl from "ytdl-core";
import * as AudioSource from "../AudioSource";
import { FallBackNotice, GuildDataContainer } from "../definition";
import { getColor } from "../Util/colorUtil";
import { CalcHourMinSec, CalcMinSec, isAvailableRawAudioURL, log, timer } from "../Util";
import { ResponseMessage } from "./ResponseMessage";
import { ManagerBase } from "./ManagerBase";
import { PageToggle } from "./PageToggle";
import { exportableCustom } from "../AudioSource";
import { TaskCancellationManager } from "./TaskCancellationManager";

export type KnownAudioSourceIdentifer = "youtube"|"custom"|"soundcloud"|"unknown";
/**
 * サーバーごとのキューを管理するマネージャー。
 * キューの追加および削除などの機能を提供します。
 */
export class QueueManager extends ManagerBase {
  // キューの本体
  private _default:QueueContent[] = [];
  // キューの本体のゲッタープロパティ
  private get default():QueueContent[] {
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
    let totalLength = 0;
    this.default.forEach(q => totalLength += Number(q.BasicInfo.LengthSeconds));
    return totalLength;
  }
  get Nothing():boolean{
    return this.length === 0;
  }

  constructor(){
    super();
    log("[QueueManager]Queue Manager instantiated");
  }

  SetData(data:GuildDataContainer){
    log("[QueueManager]Set data of guild id " + data.GuildID);
    super.SetData(data);
  }

  /**
   * キュー内の指定されたインデックスの内容を返します
   * @param index インデックス
   * @returns 指定された位置にあるキューコンテンツ
   */
  get(index:number){
    return this.default[index];
  }

  /**
   * キュー内で与えられた条件に適合するものを配列として返却します
   * @param predicate 条件を表す関数
   * @returns 条件に適合した要素の配列
   */
  filter(predicate: (value: QueueContent, index: number, array: QueueContent[]) => unknown, thisArg?: any):QueueContent[]{
    return this.default.filter(predicate, thisArg);
  }
  /**
   * キュー内のコンテンツから与えられた条件に一致する最初の要素のインデックスを返却します
   * @param predicate 条件
   * @returns インデックス
   */
  findIndex(predicate: (value: QueueContent, index: number, obj: QueueContent[]) => unknown, thisArg?: any):number{
    return this.default.findIndex(predicate, thisArg);
  }
  /**
   * キュー内のコンテンツのすべてで与えられた関数を実行し結果を配列として返却します
   * @param callbackfn 変換する関数
   * @returns 変換後の配列
   */
  map<T>(callbackfn: (value: QueueContent, index: number, array: QueueContent[]) => T, thisArg?: any):T[]{
    return this.default.map(callbackfn, thisArg);
  }

  async AddQueue(
      url:string, 
      addedBy:GuildMember, 
      method:"push"|"unshift" = "push", 
      type:KnownAudioSourceIdentifer = "unknown", 
      gotData:AudioSource.exportableCustom = null
      ):Promise<QueueContent>{
    log("[QueueManager/" + this.info.GuildID + "]AddQueue() called");
    const t = timer.start("AddQueue");
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
      result.BasicInfo = await new AudioSource.YouTube().init(url, gotData as AudioSource.exportableYouTube, this.length === 0 || method === "unshift" || this.LengthSeconds < 4 * 60 * 60 * 1000);
    }else if(type === "custom" || (type === "unknown" && isAvailableRawAudioURL(url))){
      // カスタムストリーム
      result.BasicInfo = await new AudioSource.CustomStream().init(url);
    }else if(type === "soundcloud" || url.match(/https?:\/\/soundcloud.com\/.+\/.+/)){
        // soundcloud
        result.BasicInfo = await new AudioSource.SoundCloudS().init(url, gotData as AudioSource.exportableSoundCloud);
    }else if(type === "unknown"){
      // google drive
      if(url.match(/drive\.google\.com\/file\/d\/([^\/\?]+)(\/.+)?/)){
        result.BasicInfo = await new AudioSource.GoogleDrive().init(url);
      }else if(AudioSource.StreamableApi.getVideoId(url)){
        // Streamable
        result.BasicInfo = await new AudioSource.Streamable().init(url, gotData as AudioSource.exportableStreamable);
      }else if(AudioSource.BestdoriApi.getAudioId(url)){
        // Bestdori
        result.BasicInfo = await new AudioSource.BestdoriS().init(url, gotData as AudioSource.exportableBestdori);
      }else if(AudioSource.HibikiApi.validateURL(url)){
        // Hibiki
        result.BasicInfo = await new AudioSource.Hibiki().init(url);
      }
    }
    if(result.BasicInfo){
      this._default[method](result);
      if(this.info.Bot.QueueModifiedGuilds.indexOf(this.info.GuildID) < 0){
        this.info.Bot.QueueModifiedGuilds.push(this.info.GuildID);
      }
      t.end();
      return result;
    }
    t.end();
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
   * @returns 成功した場合はtrue、それ以外の場合はfalse
   */
  async AutoAddQueue(
      client:Client, 
      url:string, 
      addedBy:GuildMember, 
      type:KnownAudioSourceIdentifer,
      first:boolean = false, 
      fromSearch:boolean|ResponseMessage = false, 
      channel:TextChannel = null,
      message:ResponseMessage = null,
      gotData:AudioSource.exportableCustom = null
      ):Promise<boolean>{
    log("[QueueManager/" + this.info.GuildID + "]AutoAddQueue() Called");
    const t = timer.start("AutoAddQueue");
    let ch:TextChannel = null;
    let msg:Message|ResponseMessage = null;
    try{
      if(fromSearch && this.info.SearchPanel){
        // 検索パネルから
        log("[QueueManager/" + this.info.GuildID + "]AutoAddQueue() From search panel");
        ch = await client.channels.fetch(this.info.SearchPanel.Msg.chId) as TextChannel;
        if(typeof fromSearch === "boolean"){
          msg = await (ch as TextChannel).messages.fetch(this.info.SearchPanel.Msg.id);
        }else{
          msg = fromSearch;
        }
        const tembed = new MessageEmbed();
        tembed.title = "お待ちください";
        tembed.description = "情報を取得しています...";
        await msg.edit({
          content: null, 
          embeds:[tembed],
          allowedMentions: {
            repliedUser: false
          },
          components: []
        });
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
        const [ehour, emin, esec] = CalcHourMinSec(this.LengthSeconds - _t - Math.floor(this.info.Player.CurrentTime / 1000));
        const embed = new MessageEmbed()
          .setColor(getColor("SONG_ADDED"))
          .setTitle("✅曲が追加されました")
          .setDescription("[" + info.BasicInfo.Title + "](" + info.BasicInfo.Url + ")")
          .addField("長さ", ((info.BasicInfo.ServiceIdentifer === "youtube" && (info.BasicInfo as AudioSource.YouTube).LiveStream) ? "ライブストリーム" : (_t !== 0 ? min + ":" + sec : "不明")), true)
          .addField("リクエスト", addedBy?.displayName ?? "不明", true)
          .addField("キュー内の位置", index === "0" ? "再生中/再生待ち" : index, true)
          .addField("再生されるまでの予想時間", index === "0" ? "-" : ((ehour === "0" ? "" : ehour + ":") + emin + ":" + esec), true)
          .setThumbnail(info.BasicInfo.Thumnail);
        if(info.BasicInfo.ServiceIdentifer === "youtube" && (info.BasicInfo as AudioSource.YouTube).IsFallbacked){
          embed.addField(":warning:注意", FallBackNotice);
        }
        await msg.edit({content: null, embeds:[embed]});
      }
    }
    catch(e){
      log("[QueueManager/" + this.info.GuildID + "]AutoAddQueue() Failed");
      log(e, "error");
      if(msg){
        msg.edit({content: ":weary: キューの追加に失敗しました。追加できませんでした。(" + e + ")", embeds: null}).catch(e => log(e, "error"));
      }
      t.end();
      return false;
    }
    t.end();
    return true;
  }

  /**
   * プレイリストを処理します
   * @param client botのクライアント
   * @param msg すでに返信済みの応答メッセージ
   * @param cancellation 処理のキャンセレーションマネージャー
   * @param queue キューマネージャー
   * @param first 最初に追加する場合はtrue、それ以外の場合はfalse
   * @param identifer オーディオソースサービス識別子
   * @param playlist プレイリスト本体。トラックの配列
   * @param title プレイリストのタイトル
   * @param totalCount プレイリストに含まれるトラック数
   * @param exportableConsumer トラックをexportableCustomに処理する関数
   * @returns 追加に成功した楽曲数
   */
  async ProcessPlaylist<T>(
    client:Client,
    msg:ResponseMessage,
    cancellation:TaskCancellationManager,
    first:boolean,
    identifer:KnownAudioSourceIdentifer, 
    playlist:T[], 
    title:string, 
    totalCount:number, 
    exportableConsumer:(track:T)=>Promise<exportableCustom>|exportableCustom
    ):Promise<number> {
    const t = timer.start("ProcessPlaylist");
    let index = 0;
    for(let i = 0; i < totalCount; i++){
      const item = playlist[i];
      const exportable = await exportableConsumer(item);
      const _result = await this.AutoAddQueue(client, exportable.url, msg.command.member, identifer, first, false, null, null, exportable);
      if(_result) index++;
      if(
        index % 50 === 0 || 
        (totalCount <= 50 && index % 10 === 0) || 
        totalCount <= 10
      ){
        await msg.edit(":hourglass_flowing_sand:プレイリスト`" + title + "`を処理しています。お待ちください。" + totalCount + "曲中" + index + "曲処理済み。");
      }
      if(cancellation.Cancelled)
        break;
    }
    t.end();
    return index;
  }

  /**
   * 次の曲に移動します
   */
  async Next(){
    log("[QueueManager/" + this.info.GuildID + "]Next() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    this.OnceLoopEnabled = false;
    this.info.Player.errorCount = 0;
    this.info.Player.errorUrl = "";
    if(this.QueueLoopEnabled){
      this.default.push(this.default[0]);
    }else{
      if(this.info.AddRelative && this.info.Player.CurrentVideoInfo.ServiceIdentifer === "youtube"){
        const relatedVideos = (this.info.Player.CurrentVideoInfo as AudioSource.YouTube).relatedVideos;
        if(relatedVideos.length >= 1){
          const video = relatedVideos[0];
          await this.info.Queue.AddQueue(video.url, null, "push", "youtube", video);
        }
      }
    }
    this._default.shift();
    if(this.info.Bot.QueueModifiedGuilds.indexOf(this.info.GuildID) < 0){
      this.info.Bot.QueueModifiedGuilds.push(this.info.GuildID);
    }
  }

  /**
   * 指定された位置のキューコンテンツを削除します
   * @param offset 位置
   */
  RemoveAt(offset:number){
    log("[QueueManager/" + this.info.GuildID + "]RemoveAt() Called (offset:" + offset + ")");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    this._default.splice(offset, 1);
    if(this.info.Bot.QueueModifiedGuilds.indexOf(this.info.GuildID) < 0){
      this.info.Bot.QueueModifiedGuilds.push(this.info.GuildID);
    }
  }

  /**
   * すべてのキューコンテンツを消去します
   */
  RemoveAll(){
    log("[QueueManager/" + this.info.GuildID + "]RemoveAll() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    this._default = [];
    if(this.info.Bot.QueueModifiedGuilds.indexOf(this.info.GuildID) < 0){
      this.info.Bot.QueueModifiedGuilds.push(this.info.GuildID);
    }
  }

  /**
   * 最初のキューコンテンツだけ残し、残りのキューコンテンツを消去します
   */
  RemoveFrom2(){
    log("[QueueManager/" + this.info.GuildID + "]RemoveFrom2() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    this._default = [this.default[0]];
    if(this.info.Bot.QueueModifiedGuilds.indexOf(this.info.GuildID) < 0){
      this.info.Bot.QueueModifiedGuilds.push(this.info.GuildID);
    }
  }

  /**
   * キューをシャッフルします
   */
  Shuffle(){
    log("[QueueManager/" + this.info.GuildID + "]Shuffle() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    if(this._default.length === 0) return;
    if(this.info.Player.IsPlaying){
      const first = this._default[0];
      this._default.shift();
      this._default.sort(() => Math.random() - 0.5);
      this._default.unshift(first);
    }else{
      this._default.sort(() => Math.random() - 0.5);
    }
    if(this.info.Bot.QueueModifiedGuilds.indexOf(this.info.GuildID) < 0){
      this.info.Bot.QueueModifiedGuilds.push(this.info.GuildID);
    }
  }

  /**
   * 条件に一致するキューコンテンツをキューから削除します
   * @param validator 条件を表す関数
   * @returns 削除されたオフセットの一覧
   */
  RemoveIf(validator:(q:QueueContent)=>Boolean){
    log("[QueueManager/" + this.info.GuildID + "]RemoveIf() Called");
    PageToggle.Organize(this.info.Bot.Toggles, 5, this.info.GuildID);
    if(this._default.length === 0) return;
    const first = this.info.Player.IsPlaying ? 1 : 0
    const rmIndex = [] as number[];
    for(let i = first; i < this._default.length; i++){
      if(validator(this._default[i])){
        rmIndex.push(i);
      }
    }
    rmIndex.sort((a,b)=>b-a);
    rmIndex.forEach(n => this.RemoveAt(n));
    if(this.info.Bot.QueueModifiedGuilds.indexOf(this.info.GuildID) < 0){
      this.info.Bot.QueueModifiedGuilds.push(this.info.GuildID);
    }
    return rmIndex;
  }

  /**
   * キュー内で移動します
   * @param from 移動元のインデックス
   * @param to 移動先のインデックス
   */
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
    if(this.info.Bot.QueueModifiedGuilds.indexOf(this.info.GuildID) < 0){
      this.info.Bot.QueueModifiedGuilds.push(this.info.GuildID);
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
  BasicInfo:AudioSource.AudioSource;
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
