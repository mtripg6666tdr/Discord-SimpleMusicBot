import { Client, Message, MessageEmbed, StreamDispatcher, TextChannel } from "discord.js";
import { GuildVoiceInfo, ytdlVideoInfo } from "../definition";
import * as ytdl from "ytdl-core";
import { Readable } from "stream";
import { CalcMinSec, log } from "../util";
import Soundcloud from "soundcloud.ts";
import { IncomingMessage } from "http";

export class PlayManager {
  private Dispatcher:StreamDispatcher = null;
  private Stream:Readable = null;
  private info:GuildVoiceInfo = null;
  get CurrentVideoUrl():string{
    if(this.CurrentVideoInfo) return this.CurrentVideoInfo.video_url;
    return "";
  }
  CurrentVideoInfo:ytdlVideoInfo;
  // 接続され、再生途中にあるか（たとえ一時停止されていても）
  get IsPlaying():boolean {
    return this.info.Connection !== null && this.Dispatcher !== null;
  }
  // VCに接続中かどうか
  get IsConnecting():boolean{
    return this.info.Connection !== null;
  }
  // 一時停止されているか
  get IsPaused():boolean{
    return this.Dispatcher && this.Dispatcher.paused;
  }
  // 現在ストリーミングした時間
  get CurrentTime():number{
    return this.Dispatcher.streamTime;
  }
  // コンストラクタ
  constructor(private client:Client){
    log("[PlayManager]Play Manager instantiated");
  }

  // 親となるGuildVoiceInfoをセットする関数（一回のみ呼び出せます）
  SetData(data:GuildVoiceInfo){
    log("[PlayManager]Set data of guild id " + data.GuildID)
    if(this.info) throw "すでに設定されています";
    this.info = data;
  }

  // 再生します
  async Play():Promise<PlayManager>{
    if(!this.info.Connection || this.Dispatcher || this.info.Queue.length == 0) {
      log("[PlayManager/" + this.info.GuildID + "]Play() called but operated nothing", "warn");
      return this;
    }
    log("[PlayManager/" + this.info.GuildID + "]Play() called");
    var mes:Message = null;
    var ch:TextChannel = null;
    if(this.info.boundTextChannel){
      ch = await this.client.channels.fetch(this.info.boundTextChannel) as TextChannel;
      mes = await ch.send(":hourglass_flowing_sand:再生準備中...");
    }
    const cantPlay = ()=>{
      log("[PlayManager:" + this.info.GuildID + "]Play() failed", "warn");
      if(this.info.Queue.LoopEnabled) this.info.Queue.LoopEnabled = false;
      if(this.info.Queue.length === 1 && this.info.Queue.QueueLoopEnabled) this.info.Queue.QueueLoopEnabled = false;
      this.Stop();
      this.info.Queue.Next();
      this.Play();
    };
    try{
      this.CurrentVideoInfo = this.info.Queue.default[0].info;
      if(this.CurrentVideoInfo.isLiveContent) {
        mes.edit("✘ライブ配信の動画は未対応です。スキップします。");
        cantPlay();
        return;
      }
      if(this.CurrentVideoInfo.description === "指定されたオーディオファイル"){
        this.Stream = null;
        this.Dispatcher = this.info.Connection.play(this.CurrentVideoInfo.video_url);
      }else if(this.CurrentVideoInfo.description === "指定されたSoundCloud URL"){
        const soundCloud = new Soundcloud();
        const imes = (await soundCloud.util.streamTrack(this.CurrentVideoInfo.video_url)) as any;
        this.Dispatcher = this.info.Connection.play(imes.responseUrl);
      }else{
        const format = ytdl.chooseFormat(this.info.Queue.default[0].formats, {
          filter: this.CurrentVideoInfo.isLiveContent ? null : "audioonly",
          quality: this.CurrentVideoInfo.isLiveContent ? null : "highestaudio",
          isHLS: this.CurrentVideoInfo.isLiveContent
        } as any);
        this.Stream = ytdl.default(this.info.Queue.default[0].info.video_url, {
          format: format
        });
        this.Dispatcher = this.info.Connection.play(this.Stream);
      }
      this.Dispatcher.on("finish", ()=> {
        log("[PlayManager/" + this.info.GuildID + "]Stream finished");
        // 再生が終わったら
        this.Dispatcher.destroy();
        this.Dispatcher = null;
        // 曲ループオン？
        if(this.info.Queue.LoopEnabled){
          this.Play();
          return;
        }else 
        // キュー整理
        this.info.Queue.Next();
        // キューがなくなったら接続終了
        if(this.info.Queue.length === 0){
          log("[PlayManager/" + this.info.GuildID + "]Queue empty");
          if(this.info.boundTextChannel){
            this.client.channels.fetch(this.info.boundTextChannel).then(ch => {
              (ch as TextChannel).send(":wave:キューが空になったため終了します").catch(e => log(e, "error"));
            }).catch(e => log(e, "error"));
          }
          this.Disconnect();
        // なくなってないなら再生開始！
        }else{
          this.Play();
        }
      });
      this.Dispatcher.on("error", (e)=>{
        log(JSON.stringify(e), "error");
        if(this.info.boundTextChannel){
          this.client.channels.fetch(this.info.boundTextChannel).then(ch => {
            log("[PlayManager/" + this.info.GuildID + "]Some error occurred in StreamDispatcher", "error");
            (ch as TextChannel).send(":tired_face:曲の再生に失敗しました...。スキップします。").catch(e => log(e, "error"));
          }).catch(e => log(e, "error"));
        }
        cantPlay();
      })
      log("[PlayManager/" + this.info.GuildID + "]Play() started successfully");
      if(this.info.boundTextChannel && ch && mes){
        var _t = Number(this.CurrentVideoInfo.lengthSeconds);
        const [min, sec] = CalcMinSec(_t);
        const embed = new MessageEmbed({
          title: ":cd:現在再生中:musical_note:",
          description: "[" + this.CurrentVideoInfo.title + "](" + this.CurrentVideoUrl + ") `" + min + ":" + sec + "`"
        });
        embed.addField("リクエスト", this.info.Queue.default[0].addedBy, true);
        embed.addField("次の曲", 
        // トラックループオンなら現在の曲
        this.info.Queue.LoopEnabled ? this.info.Queue.default[0].info.title :
        // (トラックループはオフ)長さが2以上ならオフセット1の曲
        this.info.Queue.length >= 2 ? this.info.Queue.default[1].info.title :
        // (トラックループオフ,長さ1)キューループがオンなら現在の曲
        this.info.Queue.QueueLoopEnabled ? this.info.Queue.default[0].info.title :
        // (トラックループオフ,長さ1,キューループオフ)次の曲はなし
        "次の曲がまだ登録されていません"
        , true);
        embed.addField("再生待ちの曲数", this.info.Queue.LoopEnabled ? "ループします" : (this.info.Queue.length - 1) + "曲");
        embed.thumbnail = {
          url: this.CurrentVideoInfo.thumbnails[0].url
        };
        mes.edit("", embed);
      }
    }
    catch(e){
    log(e);
      if(this.info.boundTextChannel && ch && mes){
        mes.edit(":tired_face:曲の再生に失敗しました...。スキップします。");
        cantPlay();
      }
    }

    return this;
  }

  // 停止します。切断するにはDisconnectを使用してください。
  Stop():PlayManager{
    log("[PlayManager/" + this.info.GuildID + "]Stop() called");
    if(this.Stream && !this.Stream.destroyed){
      this.Stream.destroy();
    }
    if(this.Dispatcher){
      this.Dispatcher.destroy();
      this.Dispatcher = null;
    }
    return this;
  }

  // 切断します。内部的にはStopも呼ばれています。これを呼ぶ前にStopを呼ぶ必要はありません。
  Disconnect():PlayManager{
    this.Stop();
    if(this.info.Connection){
      log("[PlayManager/" + this.info.GuildID + "]VC disconnected from " + this.info.Connection.channel.id);
      this.info.Connection.disconnect();
      this.info.Connection = null;
    }else{
      log("[PlayManager/" + this.info.GuildID + "]Disconnect() called but no connection", "warn");
    }
    return this;
  }

  // 一時停止します。
  Pause():PlayManager{
    log("[PlayManager/" + this.info.GuildID + "]Pause() called");
    this.Dispatcher?.pause();
    return this;
  }

  // 一時停止再生します。
  Resume():PlayManager{
    log("[PlayManager/" + this.info.GuildID + "]Resume() called");
    this.Dispatcher?.resume();
    return this;
  }

  // 頭出しをします。
  Rewind(){
    log("[PlayManager/" + this.info.GuildID + "]Rewind() called");
    this.Stop();
    this.Play();
  }
}