import { Client, Message, VoiceConnection } from "discord.js";
import * as fs from "fs";
import { exportableCustom } from "./AudioSource/custom";
import { PlayManager } from "./Component/PlayManager";
import { QueueManager } from "./Component/QueueManager";

// サーバーごとデータ
export class GuildVoiceInfo{
  // 永続的設定
  PersistentPref:PersistentPref;
  // ボイスチャンネルの接続
  Connection:VoiceConnection;
  // 検索窓の格納
  SearchPanel: {
    // 検索窓のメッセージを表す
    Msg: {
      // 検索窓のメッセージID
      id: string,
      // 検索窓のチャンネルID
      chId: string,
      // 検索者
      userId: string
      // 検索者名
      userName: string
    },
    // 検索窓の内容
    Opts: {[num:number]: VideoInfo}
  };
  // キューマネジャ
  Queue:QueueManager;
  // 再生マネジャ
  Manager:PlayManager;
  // 紐づけテキストチャンネル
  boundTextChannel:string;
  // サーバーID
  GuildID:string;
  // データパス
  DataPath:string;

  constructor(client:Client, message:Message){
    const guildid = message.guild.id;

    this.Connection = null;
    this.SearchPanel =null;
    this.Queue = new QueueManager();
    this.Manager = new PlayManager(client);
    this.boundTextChannel = message.channel.id;
    this.GuildID = guildid;
    this.DataPath = ".data/" + guildid + ".preferences.json";

    if(fs.existsSync(".data") && fs.existsSync(this.DataPath)){
      this.PersistentPref = JSON.parse(fs.readFileSync(this.DataPath, { encoding: "utf-8"}));
    }else{
      this.PersistentPref = {
        Prefix: ">"
      }
    }
  }

  SavePersistentPrefs(){
    fs.writeFileSync(this.DataPath, JSON.stringify(this.PersistentPref));
  }

  ResetPersistentPrefs(){
    fs.unlinkSync(this.DataPath);
  }
}

type PersistentPref = {
  Prefix:string;
}

export type VideoInfo = {
  url:string;
  title:string;
  duration:string;
};

// This type definition was distributed in https://github.com/fent/node-ytdl-core under MIT License
export type ytdlVideoInfo = {
  likes: number;
  dislikes: number;
  description: string;
  title: string;
  video_url: string;
  lengthSeconds: string;
  thumbnails:YouTubeThumbnails[];
  isLiveContent: boolean;
}

type YouTubeThumbnails = {
  url: string;
  width: number;
  height: number;
}

export const DefaultAudioThumbnailURL = "https://cdn.discordapp.com/attachments/757824315294220329/846737267951271946/Audio_icon-icons.com_71845.png";
export const YmxVersion = 2;
export type YmxFormat = {
  version:number,
  data:exportableCustom[]
}