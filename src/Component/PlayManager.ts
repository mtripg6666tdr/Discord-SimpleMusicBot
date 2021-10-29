import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import * as voice from "@discordjs/voice";
import { Readable } from "stream";
import { AudioSource, defaultM3u8stream, YouTube } from "../AudioSource";
import { FallBackNotice, GuildDataContainer } from "../definition";
import { getColor } from "../Util/colorUtil";
import { CalcHourMinSec, CalcMinSec, DownloadAsReadable, InitPassThrough, isAvailableRawVideoURL, log, timer } from "../Util";
import { ManagerBase } from "./ManagerBase";
import { FFmpeg } from "prism-media";
import { FixedAudioResource } from "./AudioResource";

/**
 * サーバーごとの再生を管理するマネージャー。
 * 再生や一時停止などの処理を行います。
 */
export class PlayManager extends ManagerBase {
  private AudioPlayer:voice.AudioPlayer = null;
  private readonly retryLimit = 3;
  error = false;
  errorCount = 0;
  errorUrl = "";
  private stopped = false;
  get CurrentVideoUrl():string{
    if(this.CurrentVideoInfo) return this.CurrentVideoInfo.Url;
    return "";
  }
  CurrentVideoInfo:AudioSource;
  // 接続され、再生途中にあるか（たとえ一時停止されていても）
  get IsPlaying():boolean {
    return this.IsConnecting
      && this.AudioPlayer
      && this.AudioPlayer.state.status !== voice.AudioPlayerStatus.Idle;
  }
  // VCに接続中かどうか
  get IsConnecting():boolean{
    return Boolean(voice.getVoiceConnection(this.info.GuildID));
  }
  // 一時停止されているか
  get IsPaused():boolean{
    return this.AudioPlayer && this.AudioPlayer.state.status === voice.AudioPlayerStatus.Paused;
  }
  // 現在ストリーミングした時間
  get CurrentTime():number{
    return (this.AudioPlayer && this.AudioPlayer.state.status === voice.AudioPlayerStatus.Playing) 
      ? (this.AudioPlayer.state as voice.AudioPlayerPlayingState).playbackDuration : 0;
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
  SetData(data:GuildDataContainer){
    log("[PlayManager]Set data of guild id " + data.GuildID)
    super.SetData(data);
  }

  // 再生します
  async Play():Promise<PlayManager>{
    // 再生できる状態か確認
    if(
      !this.IsConnecting 
      || (this.AudioPlayer && this.AudioPlayer.state.status !== voice.AudioPlayerStatus.Idle) 
      || this.info.Queue.Nothing
    ) {
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
      this.error = true;
      this.Stop();
      if(this.errorCount >= this.retryLimit){
        await this.info.Queue.Next();
      }
      this.Play();
    };
    try{
      // AudioPlayerがなければ作成
      if(!this.AudioPlayer){
        const t = timer.start("PlayManager#Play->InitAudioPlayer");
        this.AudioPlayer = voice.createAudioPlayer();
        voice.getVoiceConnection(this.info.GuildID).subscribe(this.AudioPlayer);
        if(!process.env.DEBUG){
          this.AudioPlayer.on("error", (e)=>{
            // エラーが発生したら再生できないときの関数を呼んで逃げる
            log(e.name + "\r\n" + e.message + "\r\n" + e.stack, "error");
            if(this.info.boundTextChannel){
              this.client.channels.fetch(this.info.boundTextChannel).then(ch => {
                log("[PlayManager/" + this.info.GuildID + "]Some error occurred in AudioPlayer", "error");
                (ch as TextChannel).send(":tired_face:曲の再生に失敗しました...。(" + (e ? (e.message ?? e) : "undefined") + ")" + ((this.errorCount + 1) >= this.retryLimit ? "スキップします。" : "再試行します。")).catch(e => log(e, "error"));
              }).catch(e => log(e, "error"));
            }
            cantPlay();
          });
        }
        this.AudioPlayer.on("unsubscribe", (_)=>{
          this.AudioPlayer.stop(true);
          this.AudioPlayer = null;
        });
        t.end();
      }
      const t = timer.start("PlayManager#Play->FetchAudioSource");
      // QueueContentからストリーム、M3U8プレイリスト(非HLS)または直URLを取得
      const rawStream = await this.CurrentVideoInfo.fetch();
      const stream = FixedAudioResource.fromAudioResource(this.ResolveStream(rawStream));
      // fetchおよび処理中に切断された場合処理を終了
      const connection = voice.getVoiceConnection(this.info.GuildID);
      if(!connection) {
        if(mes) await mes.delete();
        return this;
      }
      this.error = false;
      this.stopped = false;
      t.end();
      // 再生
      const u = timer.start("PlayManager#Play->EnterPlayingState");
      try{
        this.AudioPlayer.play(stream);
        await voice.entersState(this.AudioPlayer, voice.AudioPlayerStatus.Playing, 10e4);
        stream.events
          .on("error", er => {
            log("Error", "error");
            log(JSON.stringify(er), "error");
            mes.edit(":tired_face:曲の再生に失敗しました...。" + ((this.errorCount + 1) >= this.retryLimit ? "スキップします。" : "再試行します。"));
            cantPlay();  
          })
          .on("end", () => {
            this.onStreamFinished();
          });

      }catch{}
      u.end();
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
        mes.edit({content: null, embeds:[embed]}).catch(e => log(e, "error"));
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
          return this;
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
    if(this.AudioPlayer){
      this.stopped = true;
      this.AudioPlayer.stop(true);
    }
    this.info.Bot.BackupData();
    return this;
  }

  /**
   * 切断します。内部的にはStopも呼ばれています。これを呼ぶ前にStopを呼ぶ必要はありません。
   * @returns this
   */
  Disconnect():PlayManager{
    this.Stop();
    if(this.IsConnecting){
      const connection = voice.getVoiceConnection(this.info.GuildID);
      log("[PlayManager/" + this.info.GuildID + "]VC disconnected from " + connection.joinConfig.channelId);
      connection.destroy();
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
    this.AudioPlayer?.pause();
    return this;
  }

  /**
   * 一時停止再生します。
   * @returns this
   */
  Resume():PlayManager{
    this.info.Bot.BackupStatus();
    log("[PlayManager/" + this.info.GuildID + "]Resume() called");
    this.AudioPlayer?.unpause();
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

  private ResolveStream(rawStream:string|Readable|defaultM3u8stream):voice.AudioResource{
    let stream = null as voice.AudioResource;
    if(typeof rawStream === "string"){
      if(isAvailableRawVideoURL(rawStream)){
        // URLでも動画なら直接渡す
        stream = voice.createAudioResource(rawStream);
      }else{
        // ほかならストリーム化
        stream = this.ResolveResourceURL(rawStream);
      }
    }else if((rawStream as defaultM3u8stream).type){
      // M3U8プレイリストならURLを直接play
      stream = this.ResolveResourceURL((rawStream as defaultM3u8stream).url);
    }else{
      // ストリームなら変換せずにそのままplay
      const rstream = rawStream as Readable;
      if(!process.env.DEBUG){
        rstream.on('error', (e)=> {
          this.AudioPlayer.emit("error", {
            ...e,
            resource: (this.AudioPlayer.state as voice.AudioPlayerPlayingState).resource ?? null
          });
        });
      }
      stream = voice.createAudioResource(rstream);
    }
    return stream;
  }

  private ResolveResourceURL(url:string):voice.AudioResource{
    const FFMPEG_OPUS_ARGUMENTS = [
      '-analyzeduration',
      '0',
      '-loglevel',
      '0',
      '-acodec',
      'libopus',
      '-f',
      'opus',
      '-ar',
      '48000',
      '-ac',
      '2',
    ];
    const args = ['-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_on_network_error', '1', '-reconnect_on_http_error', '4xx,5xx', '-reconnect_delay_max', '30', '-i', url, ...FFMPEG_OPUS_ARGUMENTS];
    const passThrough = InitPassThrough();
    if(!process.env.DEBUG){
      passThrough.on("error", (e)=> {
        this.AudioPlayer.emit("error", {
          ...e,
          resource: (this.AudioPlayer.state as voice.AudioPlayerPlayingState).resource ?? null
        });
      });
    }
    const stream = new FFmpeg({args})
      .pipe(passThrough);
    return voice.createAudioResource(stream, {inputType: voice.StreamType.OggOpus});
  }

  private async onStreamFinished(){
    if(this.AudioPlayer && this.AudioPlayer.state.status !== voice.AudioPlayerStatus.Idle){
      await voice.entersState(this.AudioPlayer, voice.AudioPlayerStatus.Idle, 1e5);
    }
    // ストリームが終了したら時間を確認しつつ次の曲へ移行
    log("[PlayManager/" + this.info.GuildID + "]Stream finished");
    // 再生が終わったら
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
  }
}