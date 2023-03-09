/*
 * Copyright 2021-2023 mtripg6666tdr
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

import type { ResponseMessage } from "./ResponseMessage";
import type { TaskCancellationManager } from "./TaskCancellationManager";
import type { exportableCustom } from "../AudioSource";
import type { GuildDataContainer } from "../Structure";
import type { AddedBy, QueueContent } from "../Structure/QueueContent";
import type { AnyGuildTextChannel, Message } from "oceanic.js";

import { lock, LockObj } from "@mtripg6666tdr/async-lock";
import { MessageActionRowBuilder, MessageButtonBuilder, MessageEmbedBuilder } from "@mtripg6666tdr/oceanic-command-resolver/helper";

import { Member } from "oceanic.js";

import * as AudioSource from "../AudioSource";
import { ServerManagerBase } from "../Structure";
import { Util } from "../Util";
import { getColor } from "../Util/color";
import { FallBackNotice } from "../definition";

export type KnownAudioSourceIdentifer = "youtube"|"custom"|"soundcloud"|"spotify"|"unknown";
/**
 * サーバーごとのキューを管理するマネージャー。
 * キューの追加および削除などの機能を提供します。
 */
export class QueueManager extends ServerManagerBase {
  /**
   * キューの本体
   */
  protected _default: QueueContent[] = [];
  /**
   * キューの本体のゲッタープロパティ
   */
  protected get default(): Readonly<QueueContent[]>{
    return this._default;
  }

  protected _loopEnabled: boolean = false;
  /**
   * トラックループが有効か?
   */
  get loopEnabled(): boolean{
    return this._loopEnabled;
  }

  set loopEnabled(value: boolean){
    this._loopEnabled = value;
    this.emit("settingsChanged");
  }

  protected _queueLoopEnabled: boolean = false;
  /**
   * キューループが有効か?
   */
  get queueLoopEnabled(): boolean{
    return this._queueLoopEnabled;
  }

  set queueLoopEnabled(value: boolean){
    this._queueLoopEnabled = value;
    this.emit("settingsChanged");
  }

  protected _onceLoopEnabled: boolean = false;
  /**
   * ワンスループが有効か?
   */
  get onceLoopEnabled(): boolean{
    return this._onceLoopEnabled;
  }

  set onceLoopEnabled(value: boolean){
    this._onceLoopEnabled = value;
    this.emit("settingsChanged");
  }
  
  /**
   * キューの長さ（トラック数）
   */
  get length(): number{
    return this.default.length;
  }

  /**
   * キューの長さ（時間秒）
   * ライブストリームが含まれていた場合、NaNとなります
   */
  get lengthSeconds(): number{
    return this.default.reduce((prev, current) => prev + Number(current.basicInfo.lengthSeconds), 0);
  }

  /**
   * 現在取得できる限りのキューの長さ(時間秒)
   */
  get lengthSecondsActual(): number{
    return this.default.reduce((prev, current) => prev + Number(current.basicInfo.lengthSeconds || 0), 0);
  }

  get isEmpty(): boolean{
    return this.length === 0;
  }

  constructor(){
    super();
    this.setTag("QueueManager");
    this.Log("QueueManager instantiated");
  }

  override setBinding(data: GuildDataContainer){
    this.Log("Set data of guild id " + data.guildId);
    super.setBinding(data);
  }

  /**
   * キュー内の指定されたインデックスの内容を返します
   * @param index インデックス
   * @returns 指定された位置にあるキューコンテンツ
   */
  get(index: number){
    return this.default[index];
  }

  /**
   * キュー内で与えられた条件に適合するものを配列として返却します
   * @param predicate 条件を表す関数
   * @returns 条件に適合した要素の配列
   */
  filter(predicate: (value: QueueContent, index: number, array: QueueContent[]) => unknown, thisArg?: any){
    return this.default.filter(predicate, thisArg);
  }

  /**
   * キュー内のコンテンツから与えられた条件に一致する最初の要素のインデックスを返却します
   * @param predicate 条件
   * @returns インデックス
   */
  findIndex(predicate: (value: QueueContent, index: number, obj: QueueContent[]) => unknown, thisArg?: any){
    return this.default.findIndex(predicate, thisArg);
  }

  /**
   * キュー内のコンテンツのすべてで与えられた関数を実行し結果を配列として返却します
   * @param callbackfn 変換する関数
   * @returns 変換後の配列
   */
  map<T>(callbackfn: (value: QueueContent, index: number, array: QueueContent[]) => T, thisArg?: any): T[]{
    return this.default.map(callbackfn, thisArg);
  }

  /**
   * キュー内のコンテンツのすべてで与えられた関数を実行します。
   * @param callbackfn 関数
   */
  forEach(callbackfn: (value: QueueContent, index: number, array: readonly QueueContent[]) => void, thisArg?: any){
    this.default.forEach(callbackfn, thisArg);
  }

  getLengthSecondsTo(index: number){
    let sec = 0;
    if(index < 0) throw new Error("Invalid argument: " + index);
    const target = Math.min(index, this.length);
    for(let i = 0; i <= target; i++){
      sec += this.get(i).basicInfo.lengthSeconds;
    }
    return sec;
  }

  private readonly addQueueLocker = new LockObj();

  async addQueueOnly({
    url,
    addedBy,
    method = "push",
    sourceType = "unknown",
    gotData = null,
    preventCache = false,
  }: {
    url: string,
    addedBy: Member|AddedBy,
    method?: "push"|"unshift",
    sourceType?: KnownAudioSourceIdentifer,
    gotData?: AudioSource.exportableCustom,
    preventCache?: boolean,
  }): Promise<QueueContent & { index: number }>{
    return lock(this.addQueueLocker, async () => {
      this.Log("AddQueue called");
      const result = {
        basicInfo: await AudioSource.resolve({
          url,
          type: sourceType,
          knownData: gotData,
          forceCache: !preventCache && (this.length === 0 || method === "unshift" || this.lengthSeconds < 4 * 60 * 60 * 1000),
        }),
        additionalInfo: {
          addedBy: {
            userId: addedBy && this.getUserIdFromMember(addedBy) || "0",
            displayName: addedBy && this.getDisplayNameFromMember(addedBy) || "不明",
          },
        },
      } as QueueContent;
      if(result.basicInfo){
        this._default[method](result);
        if(this.server.equallyPlayback) this.sortWithAddedBy();
        this.emit(method === "push" ? "changeWithoutCurrent" : "change");
        this.emit("add", result);
        const index = this._default.findIndex(q => q === result);
        this.Log("queue content added in position " + index);
        return { ...result, index };
      }
      throw new Error("Provided URL was not resolved as available service");
    });
  }

  /**
   * ユーザーへのインタラクションやキュー追加までを一括して行います
   * @returns 成功した場合はtrue、それ以外の場合はfalse
   */
  async addQueue(options: {
    url: string,
    addedBy: Member|AddedBy|null|undefined,
    sourceType?: KnownAudioSourceIdentifer,
    first?: boolean,
    gotData?: AudioSource.exportableCustom,
    cancellable?: boolean,
  } & (
    {
      fromSearch: ResponseMessage,
      message?: undefined,
      channel?: undefined,
    } | {
      fromSearch?: undefined,
      message: ResponseMessage,
      channel?: undefined,
    } | {
      fromSearch?: undefined,
      message?: undefined,
      channel: AnyGuildTextChannel,
    })
  ): Promise<boolean>{
    this.Log("AutoAddQueue Called");
    let msg: Message<AnyGuildTextChannel>|ResponseMessage = null;

    try{
      if(options.fromSearch){
        // 検索パネルから
        this.Log("AutoAddQueue from search panel");
        msg = options.fromSearch;
        await msg.edit({
          content: "",
          embeds: [
            new MessageEmbedBuilder()
              .setTitle("お待ちください")
              .setDescription("情報を取得しています...")
              .toOceanic(),
          ],
          allowedMentions: {
            repliedUser: false,
          },
          components: [],
        });
      }else if(options.message){
        // すでに処理中メッセージがある
        this.Log("AutoAddQueue will report statuses to the specified message");
        msg = options.message;
      }else if(options.channel){
        // まだないので生成
        this.Log("AutoAddQueue will make a message that will be used to report statuses");
        msg = await options.channel.createMessage({
          content: "情報を取得しています。お待ちください...",
        });
      }

      if(this.server.queue.length > 999){
        // キュー上限
        this.Log("AutoAddQueue failed due to too long queue", "warn");
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw "キューの上限を超えています";
      }

      const info = await this.server.queue.addQueueOnly({
        url: options.url,
        addedBy: options.addedBy,
        method: options.first ? "unshift" : "push",
        sourceType: options.sourceType || "unknown",
        gotData: options.gotData || null,
      });
      this.Log("AutoAddQueue worked successfully");

      if(msg){
        // 曲の時間取得＆計算
        const _t = Number(info.basicInfo.lengthSeconds);
        const [min, sec] = Util.time.CalcMinSec(_t);
        // キュー内のオフセット取得
        const index = info.index.toString();
        // ETAの計算
        const timeFragments = Util.time.CalcHourMinSec(
          this.getLengthSecondsTo(info.index) - _t - Math.floor(this.server.player.currentTime / 1000)
        );
        const embed = new MessageEmbedBuilder()
          .setColor(getColor("SONG_ADDED"))
          .setTitle("✅曲が追加されました")
          .setDescription(`[${info.basicInfo.title}](${info.basicInfo.url})`)
          .addField("長さ", info.basicInfo.isYouTube() && info.basicInfo.isLiveStream ? "ライブストリーム" : _t !== 0 ? min + ":" + sec : "不明", true)
          .addField("リクエスト", this.getDisplayNameFromMember(options.addedBy) ?? "不明", true)
          .addField("キュー内の位置", index === "0" ? "再生中/再生待ち" : index, true)
          .addField("再生されるまでの予想時間", index === "0" ? "-" : Util.time.HourMinSecToString(timeFragments), true)
        ;
        if(info.basicInfo.isYouTube() && info.basicInfo.IsFallbacked){
          embed.addField(":warning:注意", FallBackNotice);
        }else if(info.basicInfo.isSpotify()){
          embed.addField(":warning:注意", "Spotifyのタイトルは正しく再生されない場合があります");
        }
        let lastReply: Message<AnyGuildTextChannel>|ResponseMessage = null;
        const components = !options.first && options.cancellable ? [
          new MessageActionRowBuilder()
            .addComponents(
              new MessageButtonBuilder()
                .setCustomId(`cancel-last-${this.getUserIdFromMember(options.addedBy)}`)
                .setLabel("キャンセル")
                .setStyle("DANGER")
            )
            .toOceanic(),
        ] : [];
        if(typeof info.basicInfo.thumbnail === "string"){
          embed.setThumbnail(info.basicInfo.thumbnail);
          lastReply = await msg.edit({
            content: "",
            embeds: [embed.toOceanic()],
            components,
          });
        }else{
          embed.setThumbnail("attachment://thumbnail." + info.basicInfo.thumbnail.ext);
          lastReply = await msg.edit({
            content: "",
            embeds: [embed.toOceanic()],
            components,
            files: [
              {
                name: "thumbnail." + info.basicInfo.thumbnail.ext,
                contents: info.basicInfo.thumbnail.data,
              },
            ],
          });
        }

        if(!options.first && options.cancellable){
          let componentDeleted = false;
          (["change", "changeWithoutCurrent"] as const).forEach(event => this.once(event, () => {
            if(!componentDeleted){
              componentDeleted = true;
              lastReply.edit({
                content: "",
                embeds: lastReply.embeds,
                components: [],
              });
            }
          }));
        }
      }
    }
    catch(e){
      this.Log("AutoAddQueue failed");
      this.Log(e, "error");
      if(msg){
        msg.edit({
          content: `:weary: キューの追加に失敗しました。追加できませんでした。${typeof e === "object" && "message" in e ? `(${e.message})` : ""}`,
          embeds: null,
        })
          .catch(er => Util.logger.log(er, "error"))
        ;
      }
      return false;
    }
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
    msg: ResponseMessage,
    cancellation: TaskCancellationManager,
    first: boolean,
    identifer: KnownAudioSourceIdentifer,
    playlist: T[],
    title: string,
    totalCount: number,
    exportableConsumer: (track: T) => Promise<exportableCustom>|exportableCustom
  ): Promise<number>{
    let index = 0;
    for(let i = 0; i < totalCount; i++){
      const item = playlist[i];
      if(!item) continue;
      const exportable = await exportableConsumer(item);
      const _result = await this.addQueueOnly({
        url: exportable.url,
        addedBy: msg.command.member,
        sourceType: identifer,
        method: first ? "unshift" : "push",
        gotData: exportable,
      });
      if(_result) index++;
      if(
        index % 50 === 0
        || totalCount <= 50 && index % 10 === 0
        || totalCount <= 10 && index % 4 === 0
      ){
        await msg.edit(`:hourglass_flowing_sand:プレイリスト\`${title}\`を処理しています。お待ちください。${totalCount}曲中${index}曲処理済み。`);
      }
      if(cancellation.Cancelled){
        break;
      }
    }
    return index;
  }

  /**
   * 次の曲に移動します
   */
  async next(){
    this.Log("Next Called");

    this.onceLoopEnabled = false;
    this.server.player.resetError();

    if(this.queueLoopEnabled){
      this._default.push(this.default[0]);
    }else if(this.server.addRelated && this.server.player.currentAudioInfo.isYouTube()){
      const relatedVideos = this.server.player.currentAudioInfo.relatedVideos;
      if(relatedVideos.length >= 1){
        const video = relatedVideos[0];
        await this.addQueueOnly({
          url: video.url,
          addedBy: null,
          method: "push",
          sourceType: "youtube",
          gotData: video,
        });
      }
    }
    this._default.shift();
    this.emit("change");
  }

  /**
   * 指定された位置のキューコンテンツを削除します
   * @param offset 位置
   */
  removeAt(offset: number){
    this.Log(`RemoveAt Called (offset:${offset})`);
    this._default.splice(offset, 1);
    this.emit(offset === 0 ? "change" : "changeWithoutCurrent");
  }

  /**
   * すべてのキューコンテンツを消去します
   */
  removeAll(){
    this.Log("RemoveAll Called");
    this._default = [];
    this.emit("change");
  }

  /**
   * 最初のキューコンテンツだけ残し、残りのキューコンテンツを消去します
   */
  removeFrom2nd(){
    this.Log("RemoveFrom2 Called");
    this._default = [this.default[0]];
    this.emit("changeWithoutCurrent");
  }

  /**
   * キューをシャッフルします
   */
  shuffle(){
    this.Log("Shuffle Called");
    if(this._default.length === 0) return;

    const addedByOrder: string[] = [];
    this._default.forEach(item => {
      if(!addedByOrder.includes(item.additionalInfo.addedBy.userId)){
        addedByOrder.push(item.additionalInfo.addedBy.userId);
      }
    });

    if(this.server.player.isPlaying || this.server.player.preparing){
      // 再生中/準備中には、キューの一番最初のアイテムの位置を変えずにそれ以外をシャッフルする
      const first = this._default.shift();
      this._default.sort(() => Math.random() - 0.5);
      this._default.unshift(first);
      this.emit("changeWithoutCurrent");
    }else{
      // キュー内のすべてのアイテムをシャッフルする
      this._default.sort(() => Math.random() - 0.5);
      this.emit("change");
    }
    if(this.server.equallyPlayback){
      this.sortWithAddedBy(addedByOrder);
    }
  }

  /**
   * 条件に一致するキューコンテンツをキューから削除します
   * @param validator 条件を表す関数
   * @returns 削除されたオフセットの一覧
   */
  removeIf(validator: (q: QueueContent) => boolean){
    this.Log("RemoveIf Called");
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
    this.emit(rmIndex.includes(0) ? "change" : "changeWithoutCurrent");
    return rmIndex;
  }

  /**
   * キュー内で移動します
   * @param from 移動元のインデックス
   * @param to 移動先のインデックス
   */
  move(from: number, to: number){
    this.Log("Move Called");
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
    this.emit(from === 0 || to === 0 ? "change" : "changeWithoutCurrent");
  }

  /**
   * 追加者によってできるだけ交互になるようにソートします
   */
  sortWithAddedBy(addedByUsers?: string[]){
    // 追加者の一覧とマップを作成
    const generateUserOrder = !addedByUsers;
    addedByUsers = addedByUsers || [];
    const queueByAdded = {} as { [key: string]: QueueContent[] };
    for(let i = 0; i < this._default.length; i++){
      if(!addedByUsers.includes(this._default[i].additionalInfo.addedBy.userId)){
        if(generateUserOrder){
          addedByUsers.push(this._default[i].additionalInfo.addedBy.userId);
        }
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
    this.emit("changeWithoutCurrent");
  }

  protected getDisplayNameFromMember(member: Member|AddedBy){
    return member instanceof Member ? Util.eris.user.getDisplayName(member) : member.displayName;
  }

  protected getUserIdFromMember(member: Member|AddedBy){
    return member instanceof Member ? member.id : member.userId;
  }

  override emit<T extends keyof QueueManagerEvents>(eventName: T, ...args: QueueManagerEvents[T]){
    return super.emit(eventName, ...args);
  }

  override on<T extends keyof QueueManagerEvents>(eventName: T, listener: (...args: QueueManagerEvents[T]) => void){
    return super.on(eventName, listener);
  }

  override once<T extends keyof QueueManagerEvents>(eventName: T, listener: (...args: QueueManagerEvents[T]) => void){
    return super.on(eventName, listener);
  }

  override off<T extends keyof QueueManagerEvents>(eventName: T, listener: (...args: QueueManagerEvents[T]) => void){
    return super.off(eventName, listener);
  }
}

interface QueueManagerEvents {
  change: [];
  changeWithoutCurrent: [];
  add: [content:QueueContent];
  settingsChanged: [];
}
