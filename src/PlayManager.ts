import { Client, StreamDispatcher, TextChannel } from "discord.js";
import { GuildVoiceInfo, ytdlVideoInfo } from "./definition";
import * as ytdl from "ytdl-core";

export class PlayManager {
  Dispatcher:StreamDispatcher = null;
  private info:GuildVoiceInfo;
  CurrentVideoUrl = "";
  CurrentVideoInfo:ytdlVideoInfo;
  constructor(private client:Client, guildId:string){

  }

  SetData(data:GuildVoiceInfo){
    this.info = data;
  }

  async Play(){
    try{
      if(!this.info.Connection || this.Dispatcher || this.info.Queue.length == 0) return;
      this.CurrentVideoUrl = this.info.Queue[0];
      this.CurrentVideoInfo = (await ytdl.getInfo(this.CurrentVideoUrl, {lang: "ja"})).videoDetails;
      this.Dispatcher = this.info.Connection.play(ytdl.default(this.info.Queue[0], {
        quality: "highestaudio"
      })).on("finish", ()=> {
        // 再生が終わったら
        this.Dispatcher = null;
        // 曲ループオン？
        if(this.info.Loop){
          this.Play();
          return;
        }else 
        // キューループオン？
        if(this.info.LoopQueue){
          this.info.Queue.push(this.info.Queue[0]);
        }
        // 再生中の曲削除
        this.info.Queue = this.info.Queue.slice(1, this.info.Queue.length);
        // キューがなくなったら接続終了
        if(this.info.Queue.length === 0){
          this.info.Connection.disconnect();
          this.info.Manager.Dispatcher = null;
          this.info.Connection = null;
        // なくなってないなら再生開始！
        }else{
          this.Play();
        }
      });
      if(this.info.boundTextChannel){
        const ch = await this.client.channels.fetch(this.info.boundTextChannel) as TextChannel;
        await ch.send({embed:{
          title: "現在再生中",
          description: "[" + this.CurrentVideoInfo.title + "](" + this.CurrentVideoUrl + ") `" + this.Dispatcher.streamTime + "/" + this.Dispatcher.totalStreamTime + "`"
        }});
      }
    }
    catch(e){
      console.error(e);
    }
  }
}