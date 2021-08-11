import { Client, Message, MessageEmbed, StreamDispatcher, TextChannel } from "discord.js";
import { Readable } from "stream";
import { AudioSource, defaultM3u8stream } from "../AudioSource/audiosource";
import { YouTube } from "../AudioSource/youtube";
import { EventEmitterLike, FallBackNotice, GuildVoiceInfo } from "../definition";
import { getColor } from "../Util/colorUtil";
import { CalcHourMinSec, CalcMinSec, DownloadAsReadable, isAvailableRawVideoURL, log } from "../Util/util";
import { ManagerBase } from "./ManagerBase";

/**
 * サーバーごとの再生を管理するマネージャー。
 * 再生や一時停止などの処理を行います。
 */
export class PlayManager extends ManagerBase {
  private Dispatcher:StreamDispatcher = null;
  private vol:number = 100;
  private startTime = 0;
  private pausedSince = 0;
  private readonly retryLimit = 3;
  errorCount = 0;
  errorUrl = "";
  get CurrentVideoUrl():string{
    if(this.CurrentVideoInfo) return this.CurrentVideoInfo.Url;
    return "";
  }
  CurrentVideoInfo:AudioSource;
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
    return (this.Dispatcher && this.Dispatcher.streamTime) ? this.Dispatcher.streamTime : 0;
  }
  // 音量取得
  get volume():number{
    return ((this.Dispatcher && this.Dispatcher.volume) ? this.Dispatcher.volume : 1) * 100;
  }
  set volume(newval:number){
    this.vol = newval;
    if(this.Dispatcher && this.Dispatcher.setVolume) this.Dispatcher.setVolume(newval / 100);
  }
  get Client(){
    return this.client
  };
  // コンストラクタ
  constructor(private client:Client){
    super();
    log("[PlayManager]Play Manager instantiated");
  }

  // 親となるGuildVoiceInfoをセットする関数（一回のみ呼び出せます）
  SetData(data:GuildVoiceInfo){
    log("[PlayManager]Set data of guild id " + data.GuildID)
    super.SetData(data);
  }

  // 再生します
  async Play():Promise<PlayManager>{
    // 再生できる状態か確認
    if(!this.info.Connection || this.Dispatcher || this.info.Queue.length == 0) {
      log("[PlayManager/" + this.info.GuildID + "]Play() called but operated nothing", "warn");
      return this;
    }
    log("[PlayManager/" + this.info.GuildID + "]Play() called");
    let mes:Message = null;
    let ch:TextChannel = null;
    this.CurrentVideoInfo = this.info.Queue.get(0).BasicInfo;
    if(this.info.boundTextChannel){
      ch = await this.client.channels.fetch(this.info.boundTextChannel) as TextChannel;
      const [min,sec] = CalcMinSec(this.CurrentVideoInfo.LengthSeconds);
      mes = await ch.send(":hourglass_flowing_sand: `" + this.CurrentVideoInfo.Title + "` `(" + min + ":" + sec + ")`の再生準備中...");
    }
    // 再生できない時の関数
    const cantPlay = async()=>{
      if(this.info.Queue.LoopEnabled) this.info.Queue.LoopEnabled = false;
      if(this.info.Queue.length === 1 && this.info.Queue.QueueLoopEnabled) this.info.Queue.QueueLoopEnabled = false;
      if(this.errorUrl == this.CurrentVideoInfo.Url){
        this.errorCount++;
      }else{
        this.errorCount = 1;
        this.errorUrl = this.CurrentVideoInfo.Url;
        if((this.CurrentVideoInfo as YouTube).disableCache){
          (this.CurrentVideoInfo as YouTube).disableCache();
        }
      }
      log("[PlayManager:" + this.info.GuildID + "]Play() failed, (" + this.errorCount + "times)", "warn");
      this.Stop();
      if(this.errorCount >= this.retryLimit){
        await this.info.Queue.Next();
      }
      this.Play();
    };
    try{
      // 変数の初期化
      this.pausedSince = 0;
      // fetchしている間にPlayingを読み取られた時用に適当なオブジェクトを代入してnullでなくしておく
      this.Dispatcher = EventEmitterLike as any;
      // QueueContentからストリーム、M3U8プレイリスト(非HLS)または直URLを取得
      const rawStream = await this.CurrentVideoInfo.fetch();
      let stream:Readable|string = this.ResolveStream(rawStream);
      // fetchおよび処理中に切断された場合処理を終了
      if(!this.info.Connection) {
        if(mes) await mes.delete();
        return;
      }
      // 再生
      this.Dispatcher = this.info.Connection.play(stream);
      // 音量設定
      this.Dispatcher.setVolume(this.vol / 100);
      // 各種イベント設定
      this.Dispatcher.on("start", ()=>{
        // 再生開始されたら開始された時刻を保存
        this.startTime = new Date().getTime();
      });
      this.Dispatcher.on("finish", ()=> this.onDispatcherFinished());
      this.Dispatcher.on("error", (e)=>{
        // エラーが発生したら再生できないときの関数を呼んで逃げる
        log(JSON.stringify(e), "error");
        if(this.info.boundTextChannel){
          this.client.channels.fetch(this.info.boundTextChannel).then(ch => {
            log("[PlayManager/" + this.info.GuildID + "]Some error occurred in StreamDispatcher", "error");
            (ch as TextChannel).send(":tired_face:曲の再生に失敗しました...。(" + (e ? (e.message ?? e) : "undefined") + ")" + ((this.errorCount + 1) >= this.retryLimit ? "スキップします。" : "再試行します。")).catch(e => log(e, "error"));
          }).catch(e => log(e, "error"));
        }
        cantPlay();
      });
      log("[PlayManager/" + this.info.GuildID + "]Play() started successfully");
      if(this.info.boundTextChannel && ch && mes){
        // 再生開始メッセージ
        const _t = Number(this.CurrentVideoInfo.LengthSeconds);
        const [min, sec] = CalcMinSec(_t);
        const embed = new MessageEmbed({
          title: ":cd:現在再生中:musical_note:",
          description: "[" + this.CurrentVideoInfo.Title + "](" + this.CurrentVideoUrl + ") `" + ((this.CurrentVideoInfo.ServiceIdentifer === "youtube" && (this.CurrentVideoInfo as YouTube).LiveStream) ? "(ライブストリーム)" : _t === 0 ? "(不明)" : (min + ":" + sec)) + "`"
        });
        embed.setColor(getColor("AUTO_NP"));
        embed.addField("リクエスト", this.info.Queue.get(0).AdditionalInfo.AddedBy.displayName, true);
        embed.addField("次の曲", 
          // トラックループオンなら現在の曲
          this.info.Queue.LoopEnabled ? this.info.Queue.get(0).BasicInfo.Title :
          // (トラックループはオフ)長さが2以上ならオフセット1の曲
          this.info.Queue.length >= 2 ? this.info.Queue.get(1).BasicInfo.Title :
          // (トラックループオフ,長さ1)キューループがオンなら現在の曲
          this.info.Queue.QueueLoopEnabled ? this.info.Queue.get(0).BasicInfo.Title :
          // (トラックループオフ,長さ1,キューループオフ)次の曲はなし
          "次の曲がまだ登録されていません"
          , true);
        const [qhour, qmin, qsec] = CalcHourMinSec(this.info.Queue.LengthSeconds - this.CurrentVideoInfo.LengthSeconds);
        embed.addField("再生待ちの曲", this.info.Queue.LoopEnabled ? "ループします" : ((this.info.Queue.length - 1) + "曲(" + (qhour === "0" ? "" : qhour + ":") + qmin + ":" + qsec + ")"), true);
        embed.setThumbnail(this.CurrentVideoInfo.Thumnail);
        if(this.CurrentVideoInfo.ServiceIdentifer === "youtube" && (this.CurrentVideoInfo as YouTube).IsFallbacked){
          embed.addField(":warning:注意", FallBackNotice);
        }
        mes.edit({content: "", embeds:[embed]}).catch(e => log(e, "error"));
      }
    }
    catch(e){
      log(e, "error");
      try{
        const t = typeof e == "string" ? e : JSON.stringify(e);
        if(t.indexOf("429") >= 0){
          mes.edit(":sob:レート制限が検出されました。しばらくの間YouTubeはご利用いただけません。").catch(e => log(e, "error"));
          log("Rate limit detected", "error");
          this.Stop();
          return;
        }
      }catch{};
      if(this.info.boundTextChannel && ch && mes){
        mes.edit(":tired_face:曲の再生に失敗しました...。" + ((this.errorCount + 1) >= this.retryLimit ? "スキップします。" : "再試行します。"));
        cantPlay();
      }
    }
    return this;
  }

  /** 
   * 停止します。切断するにはDisconnectを使用してください。
   * @returns this
  */
  Stop():PlayManager{
    log("[PlayManager/" + this.info.GuildID + "]Stop() called");
    if(this.Dispatcher && this.Dispatcher.destroy){
      this.Dispatcher.destroy();
    }
    this.Dispatcher = null;
    this.info.Bot.BackupData();
    return this;
  }

  /**
   * 切断します。内部的にはStopも呼ばれています。これを呼ぶ前にStopを呼ぶ必要はありません。
   * @returns this
   */
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

  /**
   * 一時停止します。
   * @returns this
   */
  Pause():PlayManager{
    this.info.Bot.BackupStatus();
    log("[PlayManager/" + this.info.GuildID + "]Pause() called");
    this.Dispatcher?.pause();
    this.pausedSince = new Date().getTime();
    return this;
  }

  /**
   * 一時停止再生します。
   * @returns this
   */
  Resume():PlayManager{
    this.info.Bot.BackupStatus();
    log("[PlayManager/" + this.info.GuildID + "]Resume() called");
    this.Dispatcher?.resume();
    if(this.pausedSince !== 0)
    this.startTime += (new Date().getTime() - this.pausedSince);
    return this;
  }

  /**
   * 頭出しをします。
   * @returns this
   */
  Rewind():PlayManager{
    log("[PlayManager/" + this.info.GuildID + "]Rewind() called");
    this.Stop().Play();
    return this;
  }

  private ResolveStream(rawStream:string|Readable|defaultM3u8stream){
    let stream = null as string|Readable;
    if(typeof rawStream === "string"){
      if(isAvailableRawVideoURL(rawStream)){
        // URLでも動画なら直接渡す
        stream = rawStream;
      }else{
        // ほかならストリーム化
        stream = DownloadAsReadable(rawStream);
        stream.on('error', (e)=> {
          this.Dispatcher.emit("error", e);
        });
      }
    }else if((rawStream as defaultM3u8stream).type){
      // M3U8プレイリストならURLを直接play
      stream = (rawStream as defaultM3u8stream).url;
    }else{
      // ストリームなら変換せずにそのままplay
      stream = rawStream as Readable;
      stream.on('error', (e)=> {
        this.Dispatcher.emit("error", e)
      });
    }
    return stream;
  }

  private onDispatcherFinished(){
    // ストリームが終了したら時間を確認しつつ次の曲へ移行
    log("[PlayManager/" + this.info.GuildID + "]Stream finished");
    const now = new Date().getTime();
    const timeout =
      this.CurrentVideoInfo.ServiceIdentifer === "bestdori" ? 5000 : 
      (this.CurrentVideoInfo.LengthSeconds * 1000 + this.startTime) > now ? this.CurrentVideoInfo.LengthSeconds * 1000 - (now - this.startTime) + 1500: 
      0;
    setTimeout(async()=>{
      // 再生が終わったら
      this.Dispatcher.destroy();
      this.Dispatcher = null;
      this.errorCount = 0;
      this.errorUrl = "";
      if(this.info.Queue.LoopEnabled){
        // 曲ループオンならばもう一度再生
        this.Play();
        return;
      }else if(this.info.Queue.OnceLoopEnabled){
        // ワンスループが有効ならもう一度同じものを再生
        this.info.Queue.OnceLoopEnabled = false;
        this.Play();
        return;
      }else{
        // キュー整理
        await this.info.Queue.Next();
      }
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
    }, timeout);
  }
}