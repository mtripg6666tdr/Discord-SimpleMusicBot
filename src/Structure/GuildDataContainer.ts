import type { MusicBot } from "../bot";
import type { SearchPanel } from "./SearchPanel";
import type { Client } from "discord.js";

import { PlayManager } from "../Component/PlayManager";
import { QueueManager } from "../Component/QueueManager";

/**
 * サーバーごとデータを保存するコンテナ
 */
export class GuildDataContainer {
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
  /**
   * 均等再生が有効
   */
  EquallyPlayback:boolean;

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
    this.PersistentPref = {
      Prefix: ">"
    };
  }
}

type PersistentPref = {
  Prefix:string,
};

type AudioEffect = {
  BassBoost:boolean,
  Reverb:boolean,
  LoudnessEqualization:boolean,
};
