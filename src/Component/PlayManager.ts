import { Client, Message, MessageEmbed, StreamDispatcher, TextChannel } from "discord.js";
import { GuildVoiceInfo, ytdlVideoInfo } from "../definition";
import * as ytdl from "ytdl-core";

export class PlayManager {
  private Dispatcher:StreamDispatcher = null;
  private info:GuildVoiceInfo = null;
  CurrentVideoUrl = "";
  CurrentVideoInfo:ytdlVideoInfo;
  // 接続され、再生途中にあるか（たとえ一時停止されていても）
  get IsPlaying():boolean {
    return this.info.Connection !== null && this.Dispatcher !== null
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
  constructor(private client:Client){

  }

  SetData(data:GuildVoiceInfo){
    if(this.info) throw "すでに設定されています";
    this.info = data;
  }

  async Play():Promise<PlayManager>{
    try{
      if(!this.info.Connection || this.Dispatcher || this.info.Queue.length == 0) return this;
      var mes:Message = null;
      var ch:TextChannel = null;
      if(this.info.boundTextChannel){
        ch = await this.client.channels.fetch(this.info.boundTextChannel) as TextChannel;
        mes = await ch.send(":hourglass_flowing_sand:再生準備中...");
      }
      this.CurrentVideoUrl = this.info.Queue.default[0];
      this.CurrentVideoInfo = (await ytdl.getInfo(this.CurrentVideoUrl, {lang: "ja"})).videoDetails;
      this.Dispatcher = this.info.Connection.play(ytdl.default(this.info.Queue.default[0], {
        quality: "highestaudio"
      })).on("finish", ()=> {
        // 再生が終わったら
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
          this.Disconnect();
        // なくなってないなら再生開始！
        }else{
          this.Play();
        }
      });
      if(this.info.boundTextChannel && ch && mes){
        var _t = Number(this.CurrentVideoInfo.lengthSeconds);
        const sec = _t % 60;
        const min = (_t - sec) / 60;
        const embed = new MessageEmbed({
          title: ":cd:現在再生中:musical_note:",
          description: "[" + this.CurrentVideoInfo.title + "](" + this.CurrentVideoUrl + ") `" + min + ":" + sec + "`"
        });
        mes.edit("", embed);
      }
    }
    catch(e){
      console.error(e);
    }

    return this;
  }

  Stop():PlayManager{
    if(this.info.Manager.Dispatcher){
      this.info.Manager.Dispatcher.destroy();
      this.info.Manager.Dispatcher = null;
    }
    return this;
  }

  Disconnect():PlayManager{
    this.Stop();
    this.info.Connection.disconnect();
    this.info.Connection = null;
    return this;
  }

  Pause():PlayManager{
    this.Dispatcher.pause();
    return this;
  }

  Resume():PlayManager{
    this.Dispatcher.resume();
    return this;
  }
}