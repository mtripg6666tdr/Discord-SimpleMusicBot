import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import { AudioSource } from "../AudioSource/audiosource";
import { GuildVoiceInfo, ytdlVideoInfo } from "../definition";
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
  // キューの長さ
  get length():number {
    return this.default.length;
  }

  constructor(){

  }

  SetData(data:GuildVoiceInfo){
    log("[PlayManager]Set data of guild id " + data.GuildID)
    if(this.info) throw "すでに設定されています";
    this.info = data;
  }

  async AddQueue(url:string, addedBy:string, method:"push"|"unshift" = "push", type:"youtube"|"custom"|"unknown" = "unknown"):Promise<AudioSource>{
    
  }

  async AddQueueFirst(url:string, addedBy:string):Promise<AudioSource>{
    return this.AddQueue(url, addedBy, "unshift");
  }

  async AutoAddQueue(client:Client, url:string, addedBy:string, first:boolean=false, channel:TextChannel = null){
    var ch:TextChannel = null;
    var msg:Message = null;
    try{
      if(this.info.SearchPanel){
        ch = await client.channels.fetch(this.info.SearchPanel.Msg.chId) as TextChannel;
        msg= await (ch as TextChannel).messages.fetch(this.info.SearchPanel.Msg.id);
        msg.edit("お待ちください...", {embed:{description: "お待ちください..."}});
      }else if(channel){
        ch = channel;
        msg = await channel.send("お待ちください...");
      }
      const info = first ? 
      await this.info.Queue.AddQueueFirst(url, addedBy) : 
      await this.info.Queue.AddQueue(url, addedBy);
      if(msg){
        const embed = new MessageEmbed();
        embed.title = "✅曲が追加されました";
        embed.description = "[" + info.Title + "](" + info.Url + ")";
        const [min,sec] = CalcMinSec(Number(info.LengthSeconds));
        embed.addField("長さ", min + ":" + sec, true);
        embed.addField("リクエスト", addedBy, true);
        embed.addField("キュー内の位置", first ? "0" : this.info.Queue.length - 1, true);
        embed.thumbnail = {
          url: info.Thumnail
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