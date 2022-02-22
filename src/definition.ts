import type { Client } from "discord.js";
import type { exportableCustom } from "./AudioSource";
import type { MusicBot } from "./bot";
import * as fs from "fs";
import { PlayManager } from "./Component/PlayManager";
import { QueueManager } from "./Component/QueueManager";
import { config } from "./Util";
import { CommandMessage } from "./Component/CommandMessage";

/**
 * サーバーごとデータを保存するコンテナ
 */
export class GuildDataContainer{
  /**
   * 永続的設定を保存するコンテナ
   */
  PersistentPref:PersistentPref;
  /**
   * 検索窓の格納します
   */
  SearchPanel: SearchPanel;
  /**
   * キューマネジャ
   */
  Queue:QueueManager;
  /**
   * 再生マネジャ
   */
  Player:PlayManager;
  /**
   * 紐づけテキストチャンネル
   */
  boundTextChannel:string;
  /**
   * サーバーID
   */
  GuildID:string;
  /**
   * データパス
   */
  DataPath:string;
  /**
   * メインボット
   */
  Bot:MusicBot;
  /**
   * 関連動画自動追加が有効
   */
  AddRelative:boolean;
  /**
   * オーディオエフェクトエフェクトの設定
   */
  EffectPrefs:AudioEffect;

  constructor(client:Client, guildid:string, boundchannelid:string, bot:MusicBot){
    this.SearchPanel = null;
    this.Queue = new QueueManager();
    this.Player = new PlayManager(client);
    this.boundTextChannel = boundchannelid;
    this.GuildID = guildid;
    this.DataPath = ".data/" + guildid + ".preferences.json";
    this.Bot = bot;
    this.AddRelative = false;
    this.EffectPrefs = {BassBoost: false, Reverb: false, LoudnessEqualization: false};

    if(fs.existsSync(".data") && fs.existsSync(this.DataPath)){
      this.PersistentPref = JSON.parse(fs.readFileSync(this.DataPath, { encoding: "utf-8"}));
    }else{
      this.PersistentPref = {
        Prefix: config.prefix || ">"
      }
    }
  }

  /**
   * @deprecated
   */
  SavePersistentPrefs(){
    fs.writeFileSync(this.DataPath, JSON.stringify(this.PersistentPref));
  }

  /**
   * @deprecated
   */
  ResetPersistentPrefs(){
    fs.unlinkSync(this.DataPath);
  }
}

type PersistentPref = {
  Prefix:string;
}

type AudioEffect = {
  BassBoost:boolean;
  Reverb:boolean;
  LoudnessEqualization:boolean;
}

export type SearchPanel = {
  /**
   * 検索窓のメッセージを保存します
   */
  Msg: {
    /**
     * 検索窓のメッセージID
     */
    id: string,
    /**
     * 検索窓のチャンネルID
     */
    chId: string,
    /**
     * 検索したユーザーのID
     */
    userId: string
    /**
     * 検索者のユーザー名
     */
    userName: string
    /**
     * 検索が要求されたときのメッセージ
     */
    commandMessage: CommandMessage
  },
  /**
   * 検索窓の内容を保存します
   */
  Opts: {[num:number]: VideoInfo}
};

export type VideoInfo = {
  url:string;
  title:string;
  duration:string;
  thumbnail:string;
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

export const FallBackNotice = "現在、通常の方法で情報を取得できなかったため、代替としてPythonライブラリにフォールバックして取得しました。処理に時間がかかるなど、正常なオペレーションができない場合があります。";
export * from "./Util/ua";
export const EventEmitterLike = {emit: ()=>{}};
export const NotSendableMessage = ":warning: コマンドが実行されたチャンネルでのボットの権限が不足しています。[メッセージを読む][メッセージの送信][埋め込みリンク][メッセージの管理][ファイルの添付]の権限があるかどうかご確認のうえ、もう一度お試しください。";
export const FFmpegDefaultArgs = [
  '-reconnect', '1', 
  '-reconnect_streamed', '1', 
  '-reconnect_on_network_error', '1', 
  '-reconnect_on_http_error', '4xx,5xx', 
  '-reconnect_delay_max', '30', 
  '-analyzeduration', '0', 
  '-loglevel', '0', 
];