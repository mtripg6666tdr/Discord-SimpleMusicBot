/*
 * Copyright 2021-2022 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

import type { exportableCustom } from "../AudioSource";
import type { GuildDataContainer } from "../Structure";
import type { AddedBy, QueueContent } from "../Structure/QueueContent";
import type { ResponseMessage } from "./ResponseMessage";
import type { TaskCancellationManager } from "./TaskCancellationManager";
import type { Client, Message, TextChannel } from "eris";

import { lock, LockObj } from "@mtripg6666tdr/async-lock";
import { Helper } from "@mtripg6666tdr/eris-command-resolver";
import { Member } from "eris";

import * as AudioSource from "../AudioSource";
import { ManagerBase } from "../Structure";
import { Util } from "../Util";
import { getColor } from "../Util/color";
import { FallBackNotice } from "../definition";
import { PageToggle } from "./PageToggle";

export type KnownAudioSourceIdentifer = "youtube"|"custom"|"soundcloud"|"unknown";
/**
 * サーバーごとのキューを管理するマネージャー。
 * キューの追加および削除などの機能を提供します。
 */
export class QueueManager extends ManagerBase {
  /**
   * キューの本体
   */
  private _default:QueueContent[] = [];
  /**
   * キューの本体のゲッタープロパティ
   */
  private get default():Readonly<QueueContent[]>{
    return this._default;
  }

  /**
   * トラックループが有効か?
   */
  loopEnabled:boolean = false;
  /**
   * キューループが有効か?
   */
  queueLoopEnabled:boolean = false;
  /**
   * ワンスループが有効か?
   */
  onceLoopEnabled:boolean = false;
  /**
   * キューの長さ（トラック数）
   */
  get length():number{
    return this.default.length;
  }

  /**
   * きゅの長さ（時間秒）
   */
  get lengthSeconds():number{
    let totalLength = 0;
    this.default.forEach(q => totalLength += Number(q.basicInfo.LengthSeconds));
    return totalLength;
  }

  get isEmpty():boolean{
    return this.length === 0;
  }

  constructor(){
    super();
    this.setTag("QueueManager");
    this.Log("QueueManager instantiated");
  }

  setBinding(data:GuildDataContainer){
    this.Log("Set data of guild id " + data.guildId);
    super.setBinding(data);
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

  getLengthSecondsTo(index:number){
    let sec = 0;
    if(index < 0) throw new Error("Invalid argument: " + index);
    const target = Math.min(index, this.length);
    for(let i = 0; i <= target; i++){
      sec += this.get(i).basicInfo.LengthSeconds;
    }
    return sec;
  }

  private readonly addQueueLocker = new LockObj();

  async addQueue(
    url:string,
    addedBy:Member|AddedBy,
    method:"push"|"unshift" = "push",
    type:KnownAudioSourceIdentifer = "unknown",
    gotData:AudioSource.exportableCustom = null
  ):Promise<QueueContent & {index:number}>{
    return lock(this.addQueueLocker, async () => {
      this.Log("AddQueue called");
      const t = Util.time.timer.start("AddQueue");
      try{
        PageToggle.Organize(this.server.bot.toggles, 5, this.server.guildId);
        const result = {
          basicInfo: await AudioSource.resolve({
            url, type,
            knownData: gotData,
            forceCache: this.length === 0 || method === "unshift" || this.lengthSeconds < 4 * 60 * 60 * 1000
          }),
          additionalInfo: {
            addedBy: {
              userId: this.getUserIdFromMember(addedBy) ?? "0",
              displayName: this.getDisplayNameFromMember(addedBy) ?? "不明"
            }
          }
        } as QueueContent;
        if(result.basicInfo){
          this._default[method](result);
          if(this.server.equallyPlayback) this.sortWithAddedBy();
          this.server.bot.backupper.addModifiedGuilds(this.guildId);
          t.end();
          const index = this._default.findIndex(q => q === result);
          this.Log("queue content added in position " + index);
          return {...result, index};
        }
      }
      finally{
        t.end();
      }
      throw new Error("Provided URL was not resolved as available service");
    });
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
  async autoAddQueue(
    client:Client,
    url:string,
    addedBy:Member|AddedBy|null|undefined,
    type:KnownAudioSourceIdentifer,
    first:boolean = false,
    fromSearch:boolean|ResponseMessage = false,
    channel:TextChannel = null,
    message:ResponseMessage = null,
    gotData:AudioSource.exportableCustom = null
  ):Promise<boolean>{
    this.Log("AutoAddQueue Called");
    const t = Util.time.timer.start("AutoAddQueue");
    let ch:TextChannel = null;
    let msg:Message<TextChannel>|ResponseMessage = null;
    try{
      if(fromSearch && this.server.searchPanel){
        // 検索パネルから
        this.Log("AutoAddQueue from search panel");
        ch = client.getChannel(this.server.searchPanel.Msg.chId) as TextChannel;
        if(typeof fromSearch === "boolean"){
          msg = ch.messages.get(this.server.searchPanel.Msg.id);
        }else{
          msg = fromSearch;
        }
        const tembed = new Helper.MessageEmbedBuilder()
          .setTitle("お待ちください")
          .setDescription("情報を取得しています...")
        ;
        await msg.edit({
          content: "",
          embeds: [tembed.toEris()],
          allowedMentions: {
            repliedUser: false
          },
          components: []
        });
      }else if(message){
        // すでに処理中メッセージがある
        this.Log("AutoAddQueue will report statuses to the specified message");
        ch = message.channel as TextChannel;
        msg = message;
      }else if(channel){
        // まだないので生成
        this.Log("AutoAddQueue will make a message that will be used to report statuses");
        ch = channel;
        msg = await channel.createMessage("情報を取得しています。お待ちください...");
      }
      if(this.server.queue.length > 999){
        // キュー上限
        this.Log("AutoAddQueue failed due to too long queue", "warn");
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw "キューの上限を超えています";
      }
      const info = await this.server.queue.addQueue(url, addedBy, first ? "unshift" : "push", type, gotData ?? null);
      this.Log("AutoAddQueue worked successfully");
      if(msg){
        // 曲の時間取得＆計算
        const _t = Number(info.basicInfo.LengthSeconds);
        const [min, sec] = Util.time.CalcMinSec(_t);
        // キュー内のオフセット取得
        const index = info.index.toString();
        // ETAの計算
        const [ehour, emin, esec] = Util.time.CalcHourMinSec(this.getLengthSecondsTo(info.index) - _t - Math.floor(this.server.player.currentTime / 1000));
        const embed = new Helper.MessageEmbedBuilder()
          .setColor(getColor("SONG_ADDED"))
          .setTitle("✅曲が追加されました")
          .setDescription("[" + info.basicInfo.Title + "](" + info.basicInfo.Url + ")")
          .addField("長さ", ((info.basicInfo.ServiceIdentifer === "youtube" && (info.basicInfo as AudioSource.YouTube).LiveStream) ? "ライブストリーム" : (_t !== 0 ? min + ":" + sec : "不明")), true)
          .addField("リクエスト", this.getDisplayNameFromMember(addedBy) ?? "不明", true)
          .addField("キュー内の位置", index === "0" ? "再生中/再生待ち" : index, true)
          .addField("再生されるまでの予想時間", index === "0" ? "-" : ((ehour === "0" ? "" : ehour + ":") + emin + ":" + esec), true)
          .setThumbnail(info.basicInfo.Thumnail)
        ;
        if(info.basicInfo.ServiceIdentifer === "youtube" && (info.basicInfo as AudioSource.YouTube).IsFallbacked){
          embed.addField(":warning:注意", FallBackNotice);
        }
        await msg.edit({content: "", embeds: [embed.toEris()]});
      }
    }
    catch(e){
      this.Log("AutoAddQueue failed");
      this.Log(Util.general.StringifyObject(e), "error");
      if(msg){
        msg.edit({content: ":weary: キューの追加に失敗しました。追加できませんでした。(" + e + ")", embeds: null}).catch(er => Util.logger.log(er, "error"));
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
  async processPlaylist<T>(
    client:Client,
    msg:ResponseMessage,
    cancellation:TaskCancellationManager,
    first:boolean,
    identifer:KnownAudioSourceIdentifer,
    playlist:T[],
    title:string,
    totalCount:number,
    exportableConsumer:(track:T)=>Promise<exportableCustom>|exportableCustom
  ):Promise<number>{
    const t = Util.time.timer.start("ProcessPlaylist");
    let index = 0;
    for(let i = 0; i < totalCount; i++){
      const item = playlist[i];
      if(!item) continue;
      const exportable = await exportableConsumer(item);
      const _result = await this.autoAddQueue(client, exportable.url, msg.command.member, identifer, first, false, null, null, exportable);
      if(_result) index++;
      if(
        index % 50 === 0
        || (totalCount <= 50 && index % 10 === 0)
        || totalCount <= 10
      ){
        await msg.edit(":hourglass_flowing_sand:プレイリスト`" + title + "`を処理しています。お待ちください。" + totalCount + "曲中" + index + "曲処理済み。");
      }
      if(cancellation.Cancelled) break;
    }
    t.end();
    return index;
  }

  /**
   * 次の曲に移動します
   */
  async next(){
    this.Log("Next Called");
    PageToggle.Organize(this.server.bot.toggles, 5, this.server.guildId);
    this.onceLoopEnabled = false;
    this.server.player.resetError();
    if(this.queueLoopEnabled){
      this._default.push(this.default[0]);
    }else if(this.server.AddRelative && this.server.player.currentAudioInfo.ServiceIdentifer === "youtube"){
      const relatedVideos = (this.server.player.currentAudioInfo as AudioSource.YouTube).relatedVideos;
      if(relatedVideos.length >= 1){
        const video = relatedVideos[0];
        await this.server.queue.addQueue(video.url, null, "push", "youtube", video);
      }
    }
    this._default.shift();
    this.server.bot.backupper.addModifiedGuilds(this.guildId);
  }

  /**
   * 指定された位置のキューコンテンツを削除します
   * @param offset 位置
   */
  removeAt(offset:number){
    this.Log(`RemoveAt Called (offset:${offset})`);
    PageToggle.Organize(this.server.bot.toggles, 5, this.server.guildId);
    this._default.splice(offset, 1);
    this.server.bot.backupper.addModifiedGuilds(this.guildId);
  }

  /**
   * すべてのキューコンテンツを消去します
   */
  removeAll(){
    this.Log("RemoveAll Called");
    PageToggle.Organize(this.server.bot.toggles, 5, this.server.guildId);
    this._default = [];
    this.server.bot.backupper.addModifiedGuilds(this.guildId);
  }

  /**
   * 最初のキューコンテンツだけ残し、残りのキューコンテンツを消去します
   */
  removeFrom2nd(){
    this.Log("RemoveFrom2 Called");
    PageToggle.Organize(this.server.bot.toggles, 5, this.server.guildId);
    this._default = [this.default[0]];
    this.server.bot.backupper.addModifiedGuilds(this.guildId);
  }

  /**
   * キューをシャッフルします
   */
  shuffle(){
    this.Log("Shuffle Called");
    PageToggle.Organize(this.server.bot.toggles, 5, this.server.guildId);
    if(this._default.length === 0) return;
    if(this.server.player.isPlaying || this.server.player.preparing){
      const first = this._default[0];
      this._default.shift();
      this._default.sort(() => Math.random() - 0.5);
      this._default.unshift(first);
    }else{
      this._default.sort(() => Math.random() - 0.5);
    }
    this.server.bot.backupper.addModifiedGuilds(this.guildId);
  }

  /**
   * 条件に一致するキューコンテンツをキューから削除します
   * @param validator 条件を表す関数
   * @returns 削除されたオフセットの一覧
   */
  removeIf(validator:(q:QueueContent)=>boolean):number[]{
    this.Log("RemoveIf Called");
    PageToggle.Organize(this.server.bot.toggles, 5, this.server.guildId);
    if(this._default.length === 0) return [];
    const first = this.server.player.isPlaying ? 1 : 0;
    const rmIndex = [] as number[];
    for(let i = first; i < this._default.length; i++){
      if(validator(this._default[i])){
        rmIndex.push(i);
      }
    }
    rmIndex.sort((a, b) => b - a);
    rmIndex.forEach(n => this.removeAt(n));
    this.server.bot.backupper.addModifiedGuilds(this.guildId);
    return rmIndex;
  }

  /**
   * キュー内で移動します
   * @param from 移動元のインデックス
   * @param to 移動先のインデックス
   */
  move(from:number, to:number){
    this.Log("Move Called");
    PageToggle.Organize(this.server.bot.toggles, 5, this.server.guildId);
    if(from < to){
      //要素追加
      this._default.splice(to + 1, 0, this.default[from]);
      //要素削除
      this._default.splice(from, 1);
    }else if(from > to){
      //要素追加
      this._default.splice(to, 0, this.default[from]);
      //要素削除
      this._default.splice(from + 1, 1);
    }
    this.server.bot.backupper.addModifiedGuilds(this.guildId);
  }

  /**
   * 追加者によってできるだけ交互になるようにソートします
   */
  sortWithAddedBy(){
    // 追加者の一覧とマップを作成
    const addedByUsers = [] as string[];
    const queueByAdded = {} as {[key:string]:QueueContent[]};
    for(let i = 0; i < this._default.length; i++){
      if(!addedByUsers.includes(this._default[i].additionalInfo.addedBy.userId)){
        addedByUsers.push(this._default[i].additionalInfo.addedBy.userId);
        queueByAdded[this._default[i].additionalInfo.addedBy.userId] = [this._default[i]];
      }else{
        queueByAdded[this._default[i].additionalInfo.addedBy.userId].push(this._default[i]);
      }
    }
    // ソートをもとにキューを再構築
    const sorted = [] as QueueContent[];
    const maxLengthByUser = Math.max(...addedByUsers.map(user => queueByAdded[user].length));
    for(let i = 0; i < maxLengthByUser; i++){
      sorted.push(...addedByUsers.map(user => queueByAdded[user][i]).filter(q => !!q));
    }
    this._default = sorted;
  }

  private getDisplayNameFromMember(member:Member|AddedBy){
    return member instanceof Member ? Util.eris.user.getDisplayName(member) : member.displayName;
  }

  private getUserIdFromMember(member:Member|AddedBy){
    return member instanceof Member ? member.id : member.userId;
  }
}
