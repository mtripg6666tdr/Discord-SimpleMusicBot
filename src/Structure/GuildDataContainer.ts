import type { exportableCustom } from "../AudioSource";
import type { MusicBotBase } from "../botBase";
import type { SearchPanel } from "./SearchPanel";
import type { YmxFormat } from "./YmxFormat";
import type { CommandMessage, ResponseMessage } from "@mtripg6666tdr/eris-command-resolver";
import type { Client, Message, VoiceChannel, VoiceConnection } from "eris";

import { LockObj } from "@mtripg6666tdr/async-lock";
import { lock } from "@mtripg6666tdr/async-lock";
import { Helper } from "@mtripg6666tdr/eris-command-resolver";
import { TextChannel } from "eris";

import Soundcloud from "soundcloud.ts";
import * as ytpl from "ytpl";

import { SoundCloudS } from "../AudioSource";
import { PlayManager } from "../Component/PlayManager";
import { QueueManager } from "../Component/QueueManager";
import { TaskCancellationManager } from "../Component/TaskCancellationManager";
import Util from "../Util";
import { LogEmitter } from "./LogEmitter";
import { YmxVersion } from "./YmxFormat";

/**
 * サーバーごとデータを保存するコンテナ
 */
export class GuildDataContainer extends LogEmitter {
  private readonly cancellations = [] as TaskCancellationManager[];
  
  /**
   * 永続的設定を保存するコンテナ
   */
  readonly persistentPref:PersistentPref;
  /**
   * 検索窓の格納します
   */
  searchPanel:SearchPanel;
  /**
   * キューマネジャ
   */
  readonly queue:QueueManager;
  /**
   * 再生マネジャ
   */
  readonly player:PlayManager;
  private _boundTextChannel:string;
  /**
   * 紐づけテキストチャンネル
   */
  get boundTextChannel(){
    return this._boundTextChannel;
  }
  
  private set boundTextChannel(val:string){
    this._boundTextChannel = val;
  }

  /**
   * サーバーID
   */
  readonly guildID:string;
  /**
   * データパス
   */
  readonly dataPath:string;
  /**
   * メインボット
   */
  readonly bot:MusicBotBase;
  /**
   * 関連動画自動追加が有効
   */
  AddRelative:boolean;
  /**
   * オーディオエフェクトエフェクトの設定
   */
  readonly effectPrefs:AudioEffect;
  /**
   * 均等再生が有効
   */
  equallyPlayback:boolean;

  /**
   * VCへの接続
   */
  connection:VoiceConnection;

  /**
   * VCのping
   */
  vcPing:number;

  constructor(client:Client, guildid:string, boundchannelid:string, bot:MusicBotBase){
    super();
    this.searchPanel = null;
    this.queue = new QueueManager();
    this.player = new PlayManager(client);
    this.boundTextChannel = boundchannelid;
    this.guildID = guildid;
    this.SetTag(`[GuildDataContainer/${guildid}]`);
    this.dataPath = ".data/" + guildid + ".preferences.json";
    this.bot = bot;
    this.AddRelative = false;
    this.effectPrefs = {BassBoost: false, Reverb: false, LoudnessEqualization: false};
    this.persistentPref = {
      Prefix: ">"
    };
    this.equallyPlayback = false;
    this.connection = null;
    this.vcPing = null;
  }

  /**
   * 状況に応じてバインドチャンネルを更新します
   * @param message 更新元となるメッセージ
   */
  updateBoundChannel(message:CommandMessage){
    if(
      !this.player.isConnecting
      || (message.member.voiceState.channelID && (this.bot.client.getChannel(message.member.voiceState.channelID) as VoiceChannel).voiceMembers.has(this.bot.client.user.id))
      || message.content.includes("join")
    ){
      if(message.content !== (this.persistentPref.Prefix || ">")) this.boundTextChannel = message.channelId;
    }
  }

  /**
   * キューをエクスポートしてテキストにします
   * @returns テキスト化されたキュー
   */
  exportQueue():string{
    return JSON.stringify({
      version: YmxVersion,
      data: this.queue.map(q => ({
        ...(q.basicInfo.exportData()),
        addBy: q.additionalInfo.addedBy
      })),
    } as YmxFormat);
  }

  /**
   * ステータスをエクスポートしてテキストにします
   * @returns テキスト化されたステータス
   */
  exportStatus(){
    // VCのID:バインドチャンネルのID:ループ:キューループ:関連曲
    return [
      this.player.isPlaying && !this.player.isPaused ? this.connection.channelID : "0",
      this.boundTextChannel,
      this.queue.loopEnabled ? "1" : "0",
      this.queue.queueLoopEnabled ? "1" : "0",
      this.AddRelative ? "1" : "0",
      this.equallyPlayback ? "1" : "0",
    ].join(":");
  }

  /**
   * キャンセルマネージャーをサーバーと紐づけます
   * @param cancellation キャンセルマネージャー
   */
  bindCancellation(cancellation:TaskCancellationManager){
    if(!this.cancellations.includes(cancellation)){
      this.cancellations.push(cancellation);
    }
    return cancellation;
  }

  /**
   * キャンセルマネージャーにキャンセルを発行します
   * @returns キャンセルができたものがあればtrue
   */
  cancelAll(){
    const results = this.cancellations.map(c => c.cancel());
    return results.some(r => r);
  }

  /**
   * キャンセルマネージャーを破棄します
   * @param cancellation 破棄するキャンセルマネージャー
   * @returns 成功したかどうか
   */
  unbindCancellation(cancellation:TaskCancellationManager){
    const index = this.cancellations.findIndex(c => c === cancellation);
    if(index < 0) return false;
    this.cancellations.splice(index, 1);
    return true;
  }

  private readonly joinVoiceChannelLocker:LockObj = new LockObj();
  /**
   * ボイスチャンネルに接続します
   * @param message コマンドを表すメッセージ
   * @param reply 応答が必要な際に、コマンドに対して返信で応じるか新しいメッセージとして応答するか。(デフォルトではfalse)
   * @returns 成功した場合はtrue、それ以外の場合にはfalse
   */
  async joinVoiceChannel(message:CommandMessage, reply:boolean = false, replyOnFail:boolean = false):Promise<boolean>{
    return lock(this.joinVoiceChannelLocker, async () => {
      const t = Util.time.timer.start("MusicBot#Join");
      if(message.member.voiceState.channelID){
        const targetVC = this.bot.client.getChannel(message.member.voiceState.channelID) as VoiceChannel;
        // すでにそのにVC入ってるよ～
        if(targetVC.voiceMembers.has(this.bot.client.user.id)){
          if(this.connection){
            t.end();
            return true;
          }
        // すでになにかしらのVCに参加している場合
        }else if(this.connection && !message.member.permissions.has("voiceMoveMembers")){
          const failedMsg = ":warning:既にほかのボイスチャンネルに接続中です。この操作を実行する権限がありません。";
          if(reply || replyOnFail){
            await message.reply(failedMsg)
              .catch(er => this.Log(er, "error"));
          }else{
            await message.channel.createMessage(failedMsg)
              .catch(er => this.Log(er, "error"));
          }
          return false;
        }

        // 入ってないね～参加しよう
        const msg = await ((mes:string) => {
          if(reply){
            return message.reply(mes);
          }
          else{
            return this.bot.client.createMessage(message.channel.id, mes);
          }
        })(":electric_plug:接続中...");
        try{
          if(!targetVC.permissionsOf(this.bot.client.user.id).has("voiceConnect")) throw new Error("ボイスチャンネルに参加できません。権限を確認してください。");
          const connection = await targetVC.join({
            selfDeaf: true,
          });
          connection
            .on("error", err => {
              Util.logger.log("[Main][Connection]" + Util.general.StringifyObject(err), "error");
              this.player.handleError(err);
            })
            .on("pong", ping => this.vcPing = ping)
          ;
          if(Util.config.debug){
            connection.on("debug", mes => Util.logger.log("[Main][Connection]" + mes, "debug"));
          }
          this.connection = connection;
          Util.logger.log(`[Main/${message.guild.id}]Connected to ${message.member.voiceState.channelID}`);
          await msg.edit(`:+1:ボイスチャンネル:speaker:\`${targetVC.name}\`に接続しました!`);
          t.end();
          return true;
        }
        catch(e){
          this.Log(e, "error");
          const failedMsg = "😑接続に失敗しました…もう一度お試しください: " + Util.general.StringifyObject(e);
          if(!reply && replyOnFail){
            await msg.delete()
              .catch(er => this.Log(er, "error"));
            await message.reply(failedMsg)
              .catch(er => this.Log(er, "error"));
          }else{
            await msg?.edit(failedMsg)
              .catch(er => this.Log(er, "error"));
          }
          this.player.disconnect();
          t.end();
          return false;
        }
      }else{
        // あらメッセージの送信者さんはボイチャ入ってないん…
        const msg = "ボイスチャンネルに参加してからコマンドを送信してください:relieved:";
        if(reply || replyOnFail){
          await message.reply(msg).catch(e => this.Log(e, "error"));
        }else{
          await message.channel.createMessage(msg).catch(e => this.Log(e, "error"));
        }
        t.end();
        return false;
      }
    });
  }

  /**
   * メッセージからストリームを判定してキューに追加し、状況に応じて再生を開始します
   * @param first キューの先頭に追加するかどうか
   */
  async playFromURL(message:CommandMessage, optiont:string, first:boolean = true){
    const t = Util.time.timer.start("MusicBot#PlayFromURL");
    setTimeout(() => message.suppressEmbeds(true).catch(e => this.Log(Util.general.StringifyObject(e), "warn")), 4000);
    if(optiont.match(/^https?:\/\/(www\.|canary\.|ptb\.)?discord(app)?\.com\/channels\/[0-9]+\/[0-9]+\/[0-9]+$/)){
      // Discordメッセへのリンクならば
      const smsg = await message.reply("🔍メッセージを取得しています...");
      try{
        const ids = optiont.split("/");
        const ch = this.bot.client.getChannel(ids[ids.length - 2]);
        if(!(ch instanceof TextChannel)) throw new Error("サーバーのテキストチャンネルではありません");
        const msg = await this.bot.client.getMessage(ch.id, ids[ids.length - 1]) as Message<TextChannel>;
        if(ch.guild.id !== msg.channel.guild.id) throw new Error("異なるサーバーのコンテンツは再生できません");
        if(msg.attachments.length <= 0 || !Util.fs.isAvailableRawAudioURL(msg.attachments[0]?.url)) throw new Error("添付ファイルが見つかりません");
        await this.queue.autoAddQueue(this.bot.client, msg.attachments[0].url, message.member, "custom", first, false, message.channel as TextChannel, smsg);
        await this.player.play();
        return;
      }
      catch(e){
        await smsg.edit(`✘追加できませんでした(${Util.general.StringifyObject(e)})`).catch(er => this.Log(er, "error"));
      }
    }else if(Util.fs.isAvailableRawAudioURL(optiont)){
      // オーディオファイルへの直リンク？
      await this.queue.autoAddQueue(this.bot.client, optiont, message.member, "custom", first, false, message.channel as TextChannel);
      await this.player.play();
      return;
    }else if(!optiont.includes("v=") && !optiont.includes("/channel/") && ytpl.validateID(optiont)){
      //違うならYouTubeプレイリストの直リンクか？
      const id = await ytpl.getPlaylistID(optiont);
      const msg = await message.reply(":hourglass_flowing_sand:プレイリストを処理しています。お待ちください。");
      const result = await ytpl.default(id, {
        gl: "JP",
        hl: "ja",
        limit: 999 - this.queue.length
      });
      const cancellation = this.bindCancellation(new TaskCancellationManager());
      const index = await this.queue.processPlaylist(
        this.bot.client,
        msg,
        cancellation,
        first,
        /* known source */ "youtube",
        /* result */ result.items,
        /* playlist name */ result.title,
        /* tracks count */ result.estimatedItemCount,
        /* consumer */ (c) => ({
          url: c.url,
          channel: c.author.name,
          description: "プレイリストから指定のため詳細は表示されません",
          isLive: c.isLive,
          length: c.durationSec,
          thumbnail: c.thumbnails[0].url,
          title: c.title
        } as exportableCustom)
      );
      if(cancellation.Cancelled){
        await msg.edit("✅キャンセルされました。");
      }else{
        const embed = new Helper.MessageEmbedBuilder()
          .setTitle("✅プレイリストが処理されました")
          .setDescription(`[${result.title}](${result.url}) \`(${result.author.name})\` \r\n${index}曲が追加されました`)
          .setThumbnail(result.bestThumbnail.url)
          .setColor(Util.color.getColor("PLAYLIST_COMPLETED"));
        await msg.edit({content: "", embeds: [embed.toEris()]});
      }
      this.cancellations.splice(this.cancellations.findIndex(c => c === cancellation), 1);
      await this.player.play();
    }else if(SoundCloudS.validatePlaylistUrl(optiont)){
      const msg = await message.reply(":hourglass_flowing_sand:プレイリストを処理しています。お待ちください。");
      const sc = new Soundcloud();
      const playlist = await sc.playlists.getV2(optiont);
      const cancellation = this.bindCancellation(new TaskCancellationManager());
      const index = await this.queue.processPlaylist(this.bot.client, msg, cancellation, first, "soundcloud", playlist.tracks, playlist.title, playlist.track_count, async (track) => {
        const item = await sc.tracks.getV2(track.id);
        return {
          url: item.permalink_url,
          title: item.title,
          description: item.description,
          length: Math.floor(item.duration / 1000),
          author: item.user.username,
          thumbnail: item.artwork_url
        } as exportableCustom;
      });
      if(cancellation.Cancelled){
        await msg.edit("✅キャンセルされました。");
      }else{
        const embed = new Helper.MessageEmbedBuilder()
          .setTitle("✅プレイリストが処理されました")
          .setDescription(`[${playlist.title}](${playlist.permalink_url}) \`(${playlist.user.username})\` \r\n${index}曲が追加されました`)
          .setThumbnail(playlist.artwork_url)
          .setColor(Util.color.getColor("PLAYLIST_COMPLETED"));
        await msg.edit({content: "", embeds: [embed.toEris()]});
      }
      this.cancellations.splice(this.cancellations.findIndex(c => c === cancellation), 1);
      await this.player.play();
    }else{
      try{
        const success = await this.queue.autoAddQueue(this.bot.client, optiont, message.member, "unknown", first, false, message.channel as TextChannel, await message.reply("お待ちください..."));
        if(success) this.player.play();
        return;
      }
      catch{
        // なに指定したし…
        await message.reply("🔭有効なURLを指定してください。キーワードで再生する場合はsearchコマンドを使用してください。")
          .catch(e => this.Log(e, "error"));
        return;
      }
    }
    t.end();
  }

  /**
   * プレフィックス更新します
   * @param message 更新元となるメッセージ
   */
  updatePrefix(message:CommandMessage|Message<TextChannel>):void{
    const guild = "guild" in message ? message.guild : message.channel.guild;
    const current = this.persistentPref.Prefix;
    const member = guild.members.get(this.bot.client.user.id);
    const pmatch = (member.nick || member.username).match(/^\[(?<prefix>.)\]/);
    if(pmatch){
      if(this.persistentPref.Prefix !== pmatch.groups.prefix){
        this.persistentPref.Prefix = Util.string.NormalizeText(pmatch.groups.prefix);
      }
    }else if(this.persistentPref.Prefix !== Util.config.prefix){
      this.persistentPref.Prefix = Util.config.prefix;
    }
    if(this.persistentPref.Prefix !== current){
      this.Log(`Prefix was set to '${this.persistentPref.Prefix}' (${guild.id})`);
    }
  }

  /**
   * 検索パネルのオプション番号を表すインデックス番号から再生します
   * @param nums インデックス番号の配列
   * @param guildid サーバーID
   * @param member 検索者のメンバー
   * @param message 検索パネルが添付されたメッセージ自体を指す応答メッセージ
   */
  async playFromSearchPanelOptions(nums:string[], guildid:string, message:ResponseMessage){
    const t = Util.time.timer.start("MusicBot#playFromSearchPanelOptions");
    const panel = this.searchPanel;
    const member = this.bot.client.guilds.get(guildid).members.get(panel.Msg.userId);
    const num = nums.shift();
    if(Object.keys(panel.Opts).includes(num)){
      await this.queue.autoAddQueue(this.bot.client, panel.Opts[Number(num)].url, member, "unknown", false, message);
      this.searchPanel = null;
      // 現在の状態を確認してVCに接続中なら接続試行
      if(member.voiceState.channelID){
        await this.joinVoiceChannel(message.command, false, false);
      }
      // 接続中なら再生を開始
      if(this.player.isConnecting && !this.player.isPlaying){
        this.player.play();
      }
    }
    const rest = nums.filter(n => Object.keys(panel.Opts).includes(n)).map(n => Number(n));
    for(let i = 0; i < rest.length; i++){
      await this.queue.autoAddQueue(this.bot.client, panel.Opts[rest[i]].url, member, "unknown", false, false, message.channel as TextChannel);
    }
    t.end();
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
