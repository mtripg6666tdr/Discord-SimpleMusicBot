import { StreamDispatcher, VoiceConnection } from "discord.js";
import { PlayManager } from "./PlayManager";

// サーバーごとデータ
export type GuildVoiceInfo = {
  // プレフィックス
  Prefix: string,
  // ボイスチャンネルの接続
  Connection:VoiceConnection,
  // 検索窓の格納
  SearchPanel: {
    // 検索窓のメッセージを表す
    Msg: {
      // 検索窓のメッセージID
      id: string,
      // 検索窓のチャンネルID
      chId: string
    },
    // 検索窓の内容
    Opts: {[num:number]: VideoInfo}
  },
  // キュー
  Queue:string[],
  // ループが有効かどうか
  Loop:Boolean,
  // キュー内ループが有効かどうか
  LoopQueue:Boolean,
  // 再生マネジャ
  Manager:PlayManager,
  // 紐づけテキストチャンネル
  boundTextChannel:string
}

export type VideoInfo = {
  url:string,
  title:string,
  duration:string
};

// This type definition was distributed in https://github.com/fent/node-ytdl-core under MIT License
export type ytdlVideoInfo = {
  likes: number;
  dislikes: number;
  description: string;
  title: string;
  video_url: string;
}