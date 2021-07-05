import * as discord from "discord.js";
import * as os from "os";
import * as ytpl from "ytpl";
import * as ytsr from "ytsr";
import Soundcloud, { SoundcloudTrackV2 } from "soundcloud.ts";
import { bestdori, BestdoriApi } from "./AudioSource/bestdori";
import { exec, execSync } from "child_process";
import { exportableCustom } from "./AudioSource/custom";
import { YouTube } from "./AudioSource/youtube";
import { PageToggle } from "./Component/PageToggle";
import { CancellationPending, DefaultUserAgent, GuildVoiceInfo, YmxFormat, YmxVersion } from "./definition";
import { getColor } from "./Util/colorUtil";
import { DatabaseAPI } from "./Util/databaseUtil";
import { GetLyrics } from "./Util/lyricsUtil";
import {
  CalcMinSec,
  CalcTime,
  DownloadText,
  GetMBytes,
  GetMemInfo,
  GetPercentage,
  isAvailableRawAudioURL,
  log,
  logStore,
  NormalizeText,
  suppressMessageEmbeds
} from "./Util/util";
import { SoundCloudTrackCollection } from "./AudioSource/soundcloud";

export class MusicBot {
  private client = new discord.Client();
  private data:{[key:string]:GuildVoiceInfo} = {};
  private instantiatedTime = null as Date;
  private versionInfo = "Could not get info";
  private cancellations = [] as CancellationPending[];
  private EmbedPageToggle:PageToggle[] = [] as PageToggle[];
  private isReadyFinished = false;
  get Toggles(){return this.EmbedPageToggle};
  get Client(){return this.client};

  constructor(){
    this.instantiatedTime = new Date();
    const client = this.client;
    log("[Main]Main bot is instantiated");
    try{
      this.versionInfo = execSync("git log -n 1 --pretty=format:%h").toString().trim();
    }
    catch{};

    client.on("ready", async()=> {
      client.voice.connections.forEach(c => c.disconnect());
      log("[Main]Main bot is ready and active now");

      await client.user.setActivity({
        type: "PLAYING",
        name: "起動中..."
      });

      if(DatabaseAPI.CanOperate){
        const queues = await DatabaseAPI.GetQueueData(client.guilds.cache.keyArray());
        const speakingIds = await DatabaseAPI.GetIsSpeaking(client.guilds.cache.keyArray());
        const queueGuildids = Object.keys(queues);
        const speakingGuildids = Object.keys(speakingIds);
        for(let i=0;i<queueGuildids.length;i++){
          let id = queueGuildids[i];
          const queue = JSON.parse(queues[id]) as YmxFormat;
          if(speakingGuildids.indexOf(id) >= 0 && queue.version === YmxVersion && speakingIds[id].indexOf(":") >= 0){
            //VCのID:バインドチャンネルのID:ループ:キューループ:関連曲
            const [vid, cid, ..._bs] = speakingIds[id].split(":");
            const [loop, qloop, related] = _bs.map(b => b === "1");
            this.initData(id, cid);
            this.data[id].boundTextChannel = cid;
            this.data[id].Queue.LoopEnabled = loop;
            this.data[id].Queue.QueueLoopEnabled = qloop;
            this.data[id].AddRelative = related;
            try{
              for(let j=0;j<queue.data.length;j++){
                await this.data[id].Queue.AutoAddQueue(client, queue.data[j].url, null, "unknown", false, false, null, null, queue.data[j]);
              }
              if(vid != "0"){
                this.data[id].Connection = await (await client.channels.fetch(vid) as discord.VoiceChannel).join();
                await this.data[id].Manager.Play();
              }
            }
            catch(e){
              log(e, "warn");
            }
          }
        }
      }

      await client.user.setActivity({
        type: "LISTENING",
        name: "音楽"
      });

      const tick = ()=>{
        this.Log();
        setTimeout(tick, 5 * 60 * 1000);
        PageToggle.Organize(this.EmbedPageToggle, 5);
        this.BackupData();
      };
      setTimeout(tick, 1 * 60 * 1000);
      this.isReadyFinished = true;
    });

    client.on("message", 
    async message => {
      // botのメッセやdm、およびnewsは無視
      if(!this.isReadyFinished || message.author.bot || message.channel.type == "dm" || message.channel.type == "news") return;
      
      // データ初期化
      this.initData(message.guild.id, message.channel.id);

      // プレフィックス
      const pmatch = message.guild.members.resolve(client.user.id).displayName.match(/^\[(?<prefix>.)\]/);
      if(pmatch){
        if(this.data[message.guild.id].PersistentPref.Prefix !== pmatch.groups.prefix){
          this.data[message.guild.id].PersistentPref.Prefix = pmatch.groups.prefix;
        }
      }else if(this.data[message.guild.id].PersistentPref.Prefix !== ">"){
        this.data[message.guild.id].PersistentPref.Prefix = ">";
      }
      
      if(message.content === "<@" + client.user.id + ">") message.channel.send("コマンドは、`" + (this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">") + "command`で確認できます").catch(e => log(e, "error"));
      if(message.content.startsWith(this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">")){
        const msg_spl = NormalizeText(message.content).substr(1, message.content.length - 1).split(" ");
        let command = msg_spl[0];
        let optiont = msg_spl.length > 1 ? message.content.substring(command.length + (this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">").length + 1, message.content.length) : "";
        let options = msg_spl.length > 1 ? msg_spl.slice(1, msg_spl.length) : [];
        
        log("[Main/" + message.guild.id + "]Command Prefix detected: " + message.content);
        
        // 超省略形を捕捉
        if(command.startsWith("http")){
          optiont = command;
          options.push(optiont);
          command = "p";
        }
        command = command.toLowerCase();

        // VC参加関数
        // 成功した場合はtrue、それ以外の場合にはfalseを返します
        const join = async():Promise<boolean>=>{
          if(message.member.voice.channelID){
            // すでにVC入ってるよ～
            if(message.member.voice.channel && message.member.voice.channel.members.has(client.user.id)){
              if(this.data[message.guild.id].Connection){
                return true;
              }else{
                message.member.voice.channel.leave();
              }
            }

            // 入ってないね～参加しよう
            const msg = await message.channel.send(":electric_plug:接続中...");
            try{
              const connection = await message.member.voice.channel.join();
              this.data[message.guild.id].Connection = connection;
              log("[Main/" + message.guild.id + "]VC Connected to " + connection.channel.id);
              await msg.edit(":+1:ボイスチャンネル:speaker:`" + message.member.voice.channel.name + "`に接続しました!");
              return true;
            }
            catch(e){
              log(e, "error");
              msg.edit("😑接続に失敗しました…もう一度お試しください。").catch(e => log(e, "error"));
              this.data[message.guild.id].Manager.Disconnect();
              return false;
            }
          }else{
            // あらメッセージの送信者さんはボイチャ入ってないん…
            await message.channel.send("ボイスチャンネルに参加してからコマンドを送信してください:relieved:").catch(e => log(e, "error"));
            return false;
          }
        };
        /**
         * メッセージからストリームを判定してキューに追加し、状況に応じて再生を開始する関数
         * @param first キューの先頭に追加するかどうか
         */
        const playFromURL = async (first:boolean = true)=>{
          setTimeout(()=>{
            suppressMessageEmbeds(message, this.client).catch(e => log(e, "warn"));
          },4000);
          // Discordメッセへのリンク？
          if(optiont.startsWith("http://discord.com/channels/") || optiont.startsWith("https://discord.com/channels/")){
            const smsg = await message.channel.send("🔍メッセージを取得しています...");
            try{
              const ids = optiont.split("/");
              const msgId = Number(ids[ids.length - 1]) ?? undefined;
              const chId = Number(ids[ids.length - 2]) ?? undefined;
              if(!isNaN(msgId) && !isNaN(chId)){
                const ch = await client.channels.fetch(ids[ids.length - 2]);
                if(ch.type === "text"){
                  const msg = await (ch as discord.TextChannel).messages.fetch(ids[ids.length - 1]);
                  if(msg.attachments.size > 0 && isAvailableRawAudioURL(msg.attachments.first().url)){
                    await this.data[message.guild.id].Queue.AutoAddQueue(client, msg.attachments.first().url, message.member, "custom", first, false, message.channel as discord.TextChannel, smsg);
                    this.data[message.guild.id].Manager.Play();
                    return;
                  }else throw "添付ファイルが見つかりません";
                }else throw "メッセージの取得に失敗"
              }else throw "解析できないURL";
            }
            catch(e){
              message.channel.send("✘追加できませんでした(" + e + ")").catch(e => log(e ,"error"));
            }
            await smsg.edit("✘メッセージは有効でない、もしくは指定されたメッセージには添付ファイルがありません。");
          }else
          // オーディオファイルへの直リンク？
          if(isAvailableRawAudioURL(optiont)){
            await this.data[message.guild.id].Queue.AutoAddQueue(client, optiont, message.member, "custom", first, false, message.channel as discord.TextChannel);
            this.data[message.guild.id].Manager.Play();
            return;
          }else{
            //違うならプレイリストの直リンクか？
            if(optiont.indexOf("v=") < 0 && ytpl.validateID(optiont)){
              const id = await ytpl.getPlaylistID(optiont);
              const msg = await message.channel.send(":hourglass_flowing_sand:プレイリストを処理しています。お待ちください。");
              const result = await ytpl.default(id, {
                gl: "JP",
                hl: "ja",
                limit: 999
              });
              let index = 1;
              const cancellation = new CancellationPending();
              this.cancellations.push(cancellation);
              for(let i = 0; i <result.items.length; i++){
                const c = result.items[i];
                await this.data[message.guild.id].Queue.AutoAddQueue(client, c.url, message.member, "youtube", false, false, null, null, {
                  url: c.url,
                  channel: c.author.name,
                  description: "プレイリストから指定のため詳細は表示されません",
                  isLive: c.isLive,
                  length: c.durationSec,
                  thumbnail: c.thumbnails[0].url,
                  title: c.title
                } as exportableCustom);
                index++;
                if(index % 50 === 0 || (result.estimatedItemCount <= 50 && index % 10 === 0) || result.estimatedItemCount <= 10){
                  await msg.edit(":hourglass_flowing_sand:プレイリスト`" + result.title + "`を処理しています。お待ちください。" + result.estimatedItemCount + "曲中" + index + "曲処理済み。");
                }
                if(cancellation.Cancelled){
                  break;
                }
              }
              if(cancellation.Cancelled){
                await msg.edit("✅キャンセルされました。");
              }else{
                const embed = new discord.MessageEmbed();
                embed.title = "✅プレイリストが処理されました";
                embed.description = "[" + result.title + "](" + result.url + ") `(" + result.author.name + ")` \r\n" + index + "曲が追加されました";
                embed.setThumbnail(result.bestThumbnail.url);
                embed.setColor(getColor("PLAYLIST_COMPLETED"));
                await msg.edit("", embed);
              }
              this.cancellations.splice(this.cancellations.findIndex(c => c === cancellation), 1);
              return;
            }
            try{
              await this.data[message.guild.id].Queue.AutoAddQueue(client, optiont, message.member, "unknown", first, false, message.channel as discord.TextChannel);
              this.data[message.guild.id].Manager.Play();
              return;
            }
            catch{
              // なに指定したし…
              message.channel.send("🔭有効なURLを指定してください。キーワードで再生する場合はsearchコマンドを使用してください。").catch(e => log(e, "error"));
              return;
            }
          }
        }

        const updateBoundChannel = ()=>{
          // テキストチャンネルバインド
          // コマンドが送信されたチャンネルを後で利用します。
          if(!this.data[message.guild.id].Manager.IsConnecting || (message.member.voice.channel && message.member.voice.channel.members.has(client.user.id)) || message.content.indexOf("join") >= 0){
            if(message.content !== (this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">"))
            this.data[message.guild.id].boundTextChannel = message.channel.id;
          }
        }

        // コマンドの処理に徹します
        switch(command){
          case "コマンド":
          case "commands":
          case "command":
          case "cmd":{
            updateBoundChannel();
            const embed = [] as discord.MessageEmbed[];
            embed.push(
              new discord.MessageEmbed()
              // ボイスチャンネル操作
              .setTitle("ボイスチャンネル操作系")
              .addField("参加, join", "ボイスチャンネルに参加します。", true)
              .addField("切断, 終了, leave, disconnect, dc", "ボイスチャンネルから切断します。", true)
              ,
              // プレイヤー制御
              new discord.MessageEmbed()
              .setTitle("音楽プレイヤー制御系")
              .addField("現在再生中, 今の曲, nowplaying, np", "現在再生中の曲の情報を表示します。", true)
              .addField("再生, play, p", "キュー内の楽曲を再生します。引数としてYouTubeの動画のURLを指定することもできます。", true)
              .addField("一時停止, 一旦停止, 停止, pause, stop", "再生を一時停止します。", true)
              .addField("スキップ, skip, s", "現在再生中の曲をスキップします", true)
              .addField("頭出し, rewind, gotop, top", "再生中の曲の頭出しを行います。", true)
              .addField("ループ, loop", "トラックごとのループを設定します。",true)
              .addField("キューループ, loopqueue, queueloop", "キュー内のループを設定します。", true)
              .addField("ワンスループ, onceloop, looponce", "現在再生中の曲を1度だけループ再生します。", true)
              .addField("シャッフル, shuffle", "キューの内容をシャッフルします。", true)
              .addField("音量, volume", "音量を調節します。1から200の間で指定します(デフォルト100)。何も引数を付けないと現在の音量を表示します。", true)
              .addField("関連動画, 関連曲, おすすめ, オススメ, related, relatedsong, r, recommend", "YouTubeから楽曲を再生終了時に、関連曲をキューに自動で追加する機能です", true)
              ,
              // プレイリスト操作系
              new discord.MessageEmbed()
              .setTitle("プレイリスト操作系")
              .addField("キュー, 再生待ち, queue, q", "キューを表示します。", true)
              .addField("検索, search, se", "曲をYouTubeで検索します。YouTubeの動画のURLを直接指定することもできます。", true)
              .addField("サウンドクラウドを検索, soundcloudを検索, searchs, ses, ss", "曲をSoundCloudで検索します", true)
              .addField("キューを検索, searchq, seq, sq", "キュー内を検索します", true)
              .addField("移動, mv, move", "曲を指定された位置から指定された位置までキュー内で移動します。2番目の曲を5番目に移動したい場合は`mv 2 5`のようにします。", true)
              .addField("最後の曲を先頭へ, movelastsongtofirst, mlstf, ml, mltf, mlf, m1", "キューの最後の曲を先頭に移動します", true)
              .addField("削除, rm, remove", "キュー内の指定された位置の曲を削除します。", true)
              .addField("全て削除, すべて削除, rmall, allrm, removeall", "キュー内の曲をすべて削除します。", true)
              .addField("leaveclean, lc", "ボイスチャンネルから離脱した人のリクエストした曲を削除して整理します", true)
              .addField("インポート, import", "指定されたメッセージに添付されたキューからインポートします。exportコマンドで出力されたファイルが添付されたメッセージのURL、あるいはキューの埋め込みのあるメッセージのURLを引数として添付してください。", true)
              .addField("エクスポート, export", "キューの内容をインポートできるようエクスポートします。", true)
              .addField("この曲で終了, end", "現在再生中の曲(再生待ちの曲)をのぞいてほかの曲をすべて削除します", true)
              .addField("study, bgm", "開発者が勝手に作った勉強用・作業用BGMのプレイリストをキューに追加します", true)
              ,
              // ユーティリティ系
              new discord.MessageEmbed()
              .setTitle("ユーティリティ系")
              .addField("リセット, reset", "サーバーの設定やデータを削除して初期化します。", true)
              .addField("アップタイム, ping, uptime", "ボットのアップタイムおよびping時間(レイテンシ)を表示します。", true)
              .addField("ログ, log, システム情報, systeminfo, sysinfo", "ホストされているサーバーやプロセスに関する技術的な情報を表示します。引数を指定して特定の内容のみ取得することもできます。", true)
              .addField("歌詞, l, lyric, lyrics", "指定された曲の歌詞を検索します。", true)
              .addField("サムネイル, thumb, thumbnail, t", "サムネイルを表示します。検索結果のオフセットを指定して検索結果のサムネイルを表示することもできます", true)
              ,
              // 一般ボット操作
              new discord.MessageEmbed()
              .setTitle("ボット操作全般")
              .addField("ヘルプ, help", "ヘルプを表示します。", true)
              .addField("command, commands, cmd", "コマンド一覧を表示します", true)
              ,
            );
            for(let i = 0; i < embed.length; i++){
              embed[i].setTitle("コマンド一覧(" + embed[i].title + ")");
              embed[i].setDescription("コマンドの一覧です。\r\n`" + (i+1) + "ページ目(" + embed.length + "ページ中)`\r\nコマンドプレフィックスは、`" + this.data[message.guild.id].PersistentPref.Prefix + "`です。");
              embed[i].setColor(getColor("COMMAND"));
            }
            const msg = await message.channel.send(embed[0]);
            const toggle = await PageToggle.init(msg, embed);
            this.EmbedPageToggle.push(toggle);
          }break;
          
          case "ヘルプ":
          case "help":{
            updateBoundChannel();
            const embed = new discord.MessageEmbed();
            embed.title = client.user.username + ":notes:";
            embed.description = "高音質な音楽を再生して、Discordでのエクスペリエンスを最高にするため作られました:robot:\r\n"
            + "利用可能なコマンドを確認するには、`" + this.data[message.guild.id].PersistentPref.Prefix + "command`を使用してください。";
            embed.addField("開発者", "[" + client.users.resolve("593758391395155978").username + "](https://github.com/mtripg6666tdr)");
            embed.addField("バージョン", "`" + this.versionInfo + "`");
            embed.addField("レポジトリ/ソースコード","https://github.com/mtripg6666tdr/Discord-SimpleMusicBot");
            embed.addField("サポートサーバー", "https://discord.gg/7DrAEXBMHe")
            embed.addField("現在対応している再生ソース", 
              "・YouTube(キーワード検索)\r\n"
            + "・YouTube(動画URL指定)\r\n"
            + "・YouTube(プレイリストURL指定)\r\n"
            + "・SoundCloud(キーワード検索)\r\n"
            + "・SoundCloud(楽曲ページURL指定)\r\n"
            + "・Streamable(動画ページURL指定)\r\n"
            + "・Discord(音声ファイルの添付付きメッセージのURL指定)\r\n"
            + "・Googleドライブ(音声ファイルの限定公開リンクのURL指定)\r\n"
            + "・オーディオファイルへの直URL"
            );
            embed.setColor(getColor("HELP"));
            message.channel.send(embed).catch(e => log(e, "error"));
          }; break;
          
          case "参加":
          case "接続":
          case "connect":
          case "join":{
            updateBoundChannel();
            if(message.member.voice.channel && message.member.voice.channel.members.has(client.user.id) && this.data[message.guild.id].Connection){
              message.channel.send("✘すでにボイスチャンネルに接続中です。").catch(e => log(e, "error"));
            }else{
              join();
            }
          }; break;
          
          case "検索":
          case "search":
          case "se":{
            updateBoundChannel();
            join();
            if(optiont.startsWith("http://") || optiont.startsWith("https://")){
              options.forEach(async u => {
                optiont = u;
                await playFromURL(!this.data[message.guild.id].Manager.IsConnecting);
              });
              return;
            }
            if(this.data[message.guild.id].SearchPanel !== null){
              message.channel.send("✘既に開かれている検索窓があります").catch(e => log(e, "error"));
              break;
            }
            if(optiont !== ""){
              this.data[message.guild.id].SearchPanel = {} as any;
              const msg = await message.channel.send("🔍検索中...");
              this.data[message.guild.id].SearchPanel = {
                Msg: {
                  id: msg.id,
                  chId: msg.channel.id,
                  userId: message.author.id,
                  userName: message.member.displayName
                },
                Opts: {}
              };
              try{
                const result = await ytsr.default(optiont, {
                  limit:12,
                  gl: "JP",
                  hl: "ja"
                });
                const embed = new discord.MessageEmbed();
                embed.title = "\"" + optiont + "\"の検索結果✨";
                embed.setColor(getColor("SEARCH"));
                let desc = "";
                let index = 1;
                for(let i = 0; i < result.items.length; i++){
                  if(result.items[i].type == "video"){
                    const video = (result.items[i] as ytsr.Video);
                    desc += "`" + index + ".` [" + video.title + "](" + video.url + ") `" + video.duration + "` - `" + video.author.name + "` \r\n\r\n";
                    this.data[message.guild.id].SearchPanel.Opts[index] = {
                      url: video.url,
                      title: video.title,
                      duration: video.duration,
                      thumbnail: video.bestThumbnail.url
                    };
                    index++;
                  }
                }
                if(index === 1){
                  this.data[message.guild.id].SearchPanel = null;
                  await msg.edit(":pensive:見つかりませんでした。");
                  return;
                }
                embed.description = desc;
                embed.footer = {
                  iconURL: message.author.avatarURL(),
                  text:"動画のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
                };
                await msg.edit("", embed);
              }
              catch(e){
                log(e, "error");
                message.channel.send("✘内部エラーが発生しました").catch(e => log(e, "error"));
              }
            }else{
              message.channel.send("引数を指定してください").catch(e => log(e, "error"));
            }
          } break;
          
          case "再生":
          case "p":
          case "play":{
            updateBoundChannel();
            // 一時停止されてるね
            if(this.data[message.guild.id].Manager.IsPaused){
              this.data[message.guild.id].Manager.Resume();
              message.channel.send(":arrow_forward: 再生を再開します。").catch(e => log(e, "error"))
              return;
            }
            // キューが空だし引数もないし添付ファイルもない
            if(this.data[message.guild.id].Queue.length == 0 && optiont == "" && message.attachments.size === 0) {
              message.channel.send("再生するコンテンツがありません").catch(e => log(e, "error"));
              return;
            }
            // VCに入れない
            if(!(await join())) {
              return;
            }
            // 引数ついてたらそれ優先
            if(optiont !== ""){
              if(optiont.startsWith("http://") || optiont.startsWith("https://")){
                options.forEach(async u => {
                  optiont = u;
                  await playFromURL(!this.data[message.guild.id].Manager.IsConnecting);
                });
              }else{
                const msg = await message.channel.send("🔍検索中...");
                const result = (await ytsr.default(optiont, {
                  limit: 10,
                  gl: "JP",
                  hl: "ja"
                })).items.filter(it => it.type === "video");
                if(result.length === 0){
                  await msg.edit(":face_with_monocle:該当する動画が見つかりませんでした");
                  return;
                }
                optiont = (result[0] as ytsr.Video).url;
                await playFromURL(!this.data[message.guild.id].Manager.IsConnecting);
                await msg.delete();
              }
            // 添付ファイルを確認
            }else if(message.attachments.size >= 1){
              optiont = message.attachments.first().url;
              await playFromURL(!this.data[message.guild.id].Manager.IsConnecting);
            // なにもないからキューから再生
            }else if(this.data[message.guild.id].Queue.length >= 1){
              this.data[message.guild.id].Manager.Play();
            }else{
              message.channel.send("✘キューが空です").catch(e => log(e, "error"));
            }
          } break;
          
          case "一時停止":
          case "一旦停止":
          case "停止":
          case "stop":
          case "pause":{
            updateBoundChannel();
            // そもそも再生状態じゃないよ...
            if(!this.data[message.guild.id].Manager.IsPlaying || this.data[message.guild.id].Manager.IsPaused){
              message.channel.send("再生中ではありません").catch(e => log(e, "error"));
            }
            // 停止しま～す
            this.data[message.guild.id].Manager.Pause();
            message.channel.send(":pause_button: 一時停止しました").catch(e => log(e, "error"));
          }break;
          
          case "切断":
          case "終了":
          case "leave":
          case "disconnect":
          case "dc":{
            updateBoundChannel();
            // そもそも再生状態じゃないよ...
            if(!this.data[message.guild.id].Manager.IsConnecting){
              message.channel.send("再生中ではありません").catch(e => log(e, "error"));
              return;
            }
            // 停止しま～す
            this.data[message.guild.id].Manager.Disconnect();
            message.channel.send(":postbox: 正常に切断しました").catch(e => log(e, "error"));
          }break;
          
          case "現在再生中":
          case "今の曲":
          case "np":
          case "nowplaying":{
            updateBoundChannel();
            // そもそも再生状態じゃないよ...
            if(!this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("再生中ではありません").catch(e => log(e, "error"));
              return;
            }
            const _s = Math.floor(this.data[message.guild.id].Manager.CurrentTime / 1000);
            const _t = Number(this.data[message.guild.id].Manager.CurrentVideoInfo.LengthSeconds);
            const [min, sec] = CalcMinSec(_s);
            const [tmin,tsec] = CalcMinSec(_t);
            const info = this.data[message.guild.id].Manager.CurrentVideoInfo;
            const embed = new discord.MessageEmbed();
            embed.setColor(getColor("NP"));
            let progressBar = "";
            embed.title = "現在再生中の曲:musical_note:";
            if(_t > 0){
              const progress = Math.floor(_s / _t * 20);
              for(let i = 1 ; i < progress; i++){
                progressBar += "=";
              }
              progressBar += "●";
              for(let i = progress + 1; i <= 20; i++){
                progressBar += "=";
              }
            }
            embed.description = "[" + info.Title + "](" + info.Url + ")\r\n" + progressBar + ((info.ServiceIdentifer === "youtube" && (info as YouTube).LiveStream) ? "(ライブストリーム)" : " `" + min + ":" + sec + "/" + (_t === 0 ? "(不明)" : tmin + ":" + tsec + "`"));
            embed.setThumbnail(info.Thumnail);
            embed.fields = info.toField(
              (options[0] === "long" || options[0] === "l" || options[0] === "verbose") ? true : false
            );
            embed.addField(":link:URL", info.Url);
  
            message.channel.send(embed).catch(e => log(e, "error"));
          }break;
          
          case "キュー":
          case "再生待ち":
          case "q":
          case "queue":{
            updateBoundChannel();
            const msg = await message.channel.send(":eyes: キューを確認しています。お待ちください...");
            const queue = this.data[message.guild.id].Queue;
            if(queue.length === 0){
              msg.edit(":face_with_raised_eyebrow:キューは空です。").catch(e => log(e, "error"));
              return;
            }
            // 合計所要時間の計算
            let totalLength = queue.LengthSeconds;
            let _page = optiont === "" ? 1 : Number(optiont);
            if(isNaN(_page)) _page = 1;
            if(queue.length > 0 && _page > Math.ceil(queue.length / 10)){
              msg.edit(":warning:指定されたページは範囲外です").catch(e => log(e, "error"));
              return;
            }
            // 合計ページ数割り出し
            const totalpage = Math.ceil(queue.length / 10);
            // ページのキューを割り出す
            const getQueueEmbed = (page:number)=>{
              const fields:{name:string, value:string}[] = [];
              for(let i = 10 * (page - 1); i < 10 * page; i++){
                if(queue.default.length <= i){
                  break;
                }
                const q = queue.default[i];
                const _t = Number(q.BasicInfo.LengthSeconds);
                const [min,sec] = CalcMinSec(_t);
                fields.push({
                  name: i !== 0 ? i.toString() : this.data[message.guild.id].Manager.IsPlaying ? "現在再生中" : "再生待ち",
                  value: "[" + q.BasicInfo.Title + "](" + q.BasicInfo.Url + ") \r\n"
                  +"長さ: `" + ((q.BasicInfo.ServiceIdentifer === "youtube" && (q.BasicInfo as YouTube).LiveStream) ? "ライブストリーム" : min + ":" + sec) + " ` \r\n"
                  +"リクエスト: `" + q.AdditionalInfo.AddedBy.displayName + "` "
                  + q.BasicInfo.npAdditional()
                });
              }
              const [tmin, tsec] = CalcMinSec(totalLength);
              return new discord.MessageEmbed({
                title: message.guild.name + "のキュー",
                description: "`" + page + "ページ目(" + totalpage + "ページ中)`",
                fields: fields,
                author: {
                  icon_url: client.user.avatarURL(),
                  name: client.user.username
                },
                footer: {
                  text: queue.length + "曲 | 合計:" + tmin + ":" + tsec + " | トラックループ:" + (queue.LoopEnabled ? "⭕" : "❌") + " | キューループ:" + (queue.QueueLoopEnabled ? "⭕" : "❌")
                },
                thumbnail: {
                  url: message.guild.iconURL()
                },
                color: getColor("QUEUE")
              });
            }

            // 送信
            await msg.edit("", getQueueEmbed(_page)).catch(e => log(e, "error"));
            if(totalpage > 1){
              this.EmbedPageToggle.push((await PageToggle.init(msg, (n) => getQueueEmbed(n + 1), totalpage, _page - 1)).SetFresh(true));
            }
          }break;
          
          case "リセット":
          case "reset":{
            updateBoundChannel();
            // VC接続中なら切断
            if(this.data[message.guild.id].Manager.IsConnecting){
              this.data[message.guild.id].Manager.Disconnect();
            }
            // サーバープリファレンスをnullに
            this.data[message.guild.id] = null;
            // データ初期化
            this.initData(message.guild.id, message.channel.id);
            message.channel.send("✅サーバーの設定を初期化しました").catch(e => log(e, "error"));
          }break;
          
          case "スキップ":
          case "s":
          case "skip":{
            updateBoundChannel();
            // そもそも再生状態じゃないよ...
            if(!this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("再生中ではありません").catch(e => log(e, "error"));
              return;
            }
            const title = this.data[message.guild.id].Queue.default[0].BasicInfo.Title;
            this.data[message.guild.id].Manager.Stop();
            await this.data[message.guild.id].Queue.Next();
            this.data[message.guild.id].Manager.Play();
            message.channel.send(":track_next: `" + title + "`をスキップしました:white_check_mark:").catch(e => log(e, "error"));
          }break;
          
          case "ループ":
          case "loop":{
            updateBoundChannel();
            if(this.data[message.guild.id].Queue.LoopEnabled){
              this.data[message.guild.id].Queue.LoopEnabled = false;
              message.channel.send(":repeat_one:トラックリピートを無効にしました:x:").catch(e => log(e, "error"));
            }else{
              this.data[message.guild.id].Queue.LoopEnabled = true;
              message.channel.send(":repeat_one:トラックリピートを有効にしました:o:").catch(e => log(e, "error"));
            }
          }break;
          
          case "キューループ":
          case "queueloop":
          case "loopqueue":{
            updateBoundChannel();
            if(this.data[message.guild.id].Queue.QueueLoopEnabled){
              this.data[message.guild.id].Queue.QueueLoopEnabled = false;
              message.channel.send(":repeat:キューリピートを無効にしました:x:").catch(e => log(e, "error"));
            }else{
              this.data[message.guild.id].Queue.QueueLoopEnabled = true;
              message.channel.send(":repeat:キューリピートを有効にしました:o:").catch(e => log(e, "error"));
            }
          }break;
          
          case "削除":
          case "rm":
          case "remove":{
            updateBoundChannel();
            if(options.length == 0){
              message.channel.send("引数に消去する曲のオフセット(番号)を入力してください。例えば、2番目と5番目の曲を削除したい場合、`" + this.data[message.guild.id].PersistentPref.Prefix + command + " 2 5`と入力します。").catch(e => log(e, "error"));
              return;
            }
            if(options.indexOf("0") >= 0 && this.data[message.guild.id].Manager.IsPlaying) {
              message.channel.send("現在再生中の楽曲を削除することはできません。");
              return;
            }
            const q = this.data[message.guild.id].Queue;
            const addition = [] as number[];
            options.forEach(o => {
              let match = o.match(/^(?<from>[0-9]+)-(?<to>[0-9]+)$/);
              if(match){
                const from = Number(match.groups.from);
                const to = Number(match.groups.to);
                if(!isNaN(from) && !isNaN(to) && from<=to){
                  for(let i = from; i <= to; i++){
                    addition.push(i);
                  }
                }
              }else{
                match = o.match(/^(?<from>[0-9]+)-$/);
                if(match){
                  const from = Number(match.groups.from);
                  if(!isNaN(from)){
                    for(let i = from; i < q.length; i++){
                      addition.push(i);
                    }
                  }
                }else{
                  match = o.match(/^-(?<to>[0-9]+)$/);
                  if(match){
                    const to = Number(match.groups.to);
                    if(!isNaN(to)){
                      for(let i = (this.data[message.guild.id].Manager.IsPlaying ? 1 : 0); i <= to; i++){
                        addition.push(i);
                      }
                    }
                  }
                }
              }
            });
            options = options.concat(addition.map(n => n.toString()));
            const dels = Array.from(new Set(
                options.map(str => Number(str)).filter(n => !isNaN(n)).sort((a,b)=>b-a)
            ));
            const title = dels.length === 1 ? q.default[dels[0]].BasicInfo.Title : null;
            for(let i = 0; i < dels.length; i++){
              q.RemoveAt(Number(dels[i]));
            }
            const resultStr = dels.sort((a,b)=>a-b).join(",");
            message.channel.send("🚮" + (resultStr.length > 100 ? "指定された" : resultStr + "番目の") + "曲" + (title ? ("(`" + title + "`)") : "") + "を削除しました").catch(e => log(e, "error"));
          }break;
          
          case "すべて削除":
          case "全て削除":
          case "rmall":
          case "allrm":
          case "removeall":{
            updateBoundChannel();
            if(!message.member.voice.channel || (message.member.voice.channel && !message.member.voice.channel.members.has(client.user.id))){
              if(!message.member.hasPermission("MANAGE_GUILD") && !message.member.hasPermission("MANAGE_CHANNELS")){
                message.channel.send("この操作を実行する権限がありません。").catch(e => log(e, "error"));
                return;
              }
            }
            this.data[message.guild.id].Manager.Disconnect();
            this.data[message.guild.id].Queue.RemoveAll();
            message.channel.send("✅すべて削除しました").catch(e => log(e, "error"))
          }break;
          
          case "頭出し":
          case "rewind":
          case "top":
          case "replay":
          case "gotop":{
            updateBoundChannel();
            if(!this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("再生中ではありません").catch(e => log(e, "error"));
              return;
            }
            this.data[message.guild.id].Manager.Rewind();
            message.channel.send(":rewind:再生中の楽曲を頭出ししました:+1:").catch(e => log(e, "error"));
          }break;
          
          case "アップタイム":
          case "ping":
          case "uptime":{
            updateBoundChannel();
            const now = new Date();
            const insta = CalcTime(now.getTime() - this.instantiatedTime.getTime());
            const ready = CalcTime(now.getTime() - this.client.readyAt.getTime());
            const embed = new discord.MessageEmbed();
            embed.setColor(getColor("UPTIME"));
            embed.title = client.user.username + "のアップタイム";
            embed.addField("サーバー起動からの経過した時間", insta[0] + "時間" + insta[1] + "分" + insta[2] + "秒");
            embed.addField("Botが起動してからの経過時間", ready[0] + "時間" + ready[1] + "分" + ready[2] + "秒");
            embed.addField("レイテンシ", (new Date().getTime() - message.createdAt.getTime()) + "ミリ秒");
            embed.addField("データベースに登録されたサーバー数", Object.keys(this.data).length + "サーバー");
            message.channel.send(embed).catch(e => log(e, "error"));
          }break;
          
          case "ログ":
          case "systeminfo":
          case "sysinfo":
          case "info":
          case "システム情報":
          case "log":{
            updateBoundChannel();
            // Run default logger
            this.Log();

            if(message.author.id === "593758391395155978" && (options.indexOf("log") >= 0 || options.length == 0)){
              // Process Logs
              const logEmbed = new discord.MessageEmbed();
              logEmbed.setColor(getColor("UPTIME"));
              logEmbed.title = "Log";
              logEmbed.description = "Last " + logStore.data.length + " bot logs\r\n```\r\n" + logStore.data.join("\r\n") + "\r\n```";
              message.channel.send(logEmbed).catch(e => log(e, "error"));
            }

            if(options.indexOf("cpu") >= 0 || options.length == 0){
              // Process CPU Info
              const cpuInfoEmbed = new discord.MessageEmbed();
              cpuInfoEmbed.setColor(getColor("UPTIME"));
              const cpus = os.cpus();
              cpuInfoEmbed.title = "CPU Info";
              for(let i = 0; i < cpus.length; i++){
                const all = cpus[i].times.user + cpus[i].times.sys + cpus[i].times.nice + cpus[i].times.irq + cpus[i].times.idle;
                cpuInfoEmbed.addField(
                  "CPU" + (i + 1), "Model: `" + cpus[i].model + "`\r\n" 
                + "Speed: `" + cpus[i].speed + "MHz`\r\n"
                + "Times(user): `" + Math.round(cpus[i].times.user / 1000) + "s(" + GetPercentage(cpus[i].times.user, all) + "%)`\r\n"
                + "Times(sys): `" + Math.round(cpus[i].times.sys / 1000) + "s(" + GetPercentage(cpus[i].times.sys, all) + "%)`\r\n"
                + "Times(nice): `" + Math.round(cpus[i].times.nice / 1000) + "s(" + GetPercentage(cpus[i].times.nice, all) + "%)`\r\n"
                + "Times(irq): `" + Math.round(cpus[i].times.irq / 1000) + "s(" + GetPercentage(cpus[i].times.irq, all) + "%)`\r\n"
                + "Times(idle): `" + Math.round(cpus[i].times.idle / 1000) + "s(" + GetPercentage(cpus[i].times.idle, all) + "%)`"
                , true);
              }
              message.channel.send(cpuInfoEmbed).catch(e => log(e, "error"));
            }

            if(options.indexOf("mem") >= 0 || options.length == 0){
              // Process Mem Info
              const memInfoEmbed = new discord.MessageEmbed();
              memInfoEmbed.setColor(getColor("UPTIME"));
              const memory = GetMemInfo();
              const nMem = process.memoryUsage();
              memInfoEmbed.title = "Memory Info";
              memInfoEmbed.addField("Total Memory", 
                  "Total: `" + memory.total + "MB`\r\n"
                + "Used: `" + memory.used + "MB`\r\n"
                + "Free: `" + memory.free + "MB`\r\n"
                + "Usage: `" + memory.usage + "%`"
              , true);
              let rss = GetMBytes(nMem.rss);
              let ext = GetMBytes(nMem.external);
              memInfoEmbed.addField("Main Process Memory", 
                  "RSS: `" + rss + "MB`\r\n"
                + "Heap total: `" + GetMBytes(nMem.heapTotal) + "MB`\r\n"
                + "Heap used: `" + GetMBytes(nMem.heapUsed) + "MB`\r\n"
                + "Array buffers: `" + GetMBytes(nMem.arrayBuffers) + "MB`\r\n"
                + "External: `" + ext + "MB`\r\n"
                + "Total: `" + GetPercentage(rss + ext, memory.total) + "%`"
              , true);
              message.channel.send(memInfoEmbed).catch(e => log(e, "error"));
            }
          }break;
          
          case "移動":
          case "mv":
          case "move":{
            updateBoundChannel();
            if(options.length !== 2){
              message.channel.send("✘引数は`移動したい曲の元のオフセット(番号) 移動先のオフセット(番号)`のように指定します。\r\n例えば、5番目の曲を2番目に移動したい場合は`" + this.data[message.guild.id].PersistentPref.Prefix + command + " 5 2`と入力します。").catch(e => log(e, "error"));
              return;
            }else if(options.indexOf("0") >= 0 && this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("✘音楽の再生中(および一時停止中)は移動元または移動先に0を指定することはできません。").catch(e => log(e, "error"));
              return;
            }
            const from = Number(options[0]);
            const to = Number(options[1]);
            const q = this.data[message.guild.id].Queue;
            if(
              0 <= from && from <= q.default.length &&
              0 <= to && to <= q.default.length
              ){
                const title = q.default[from].BasicInfo.Title
                if(from !== to){
                  q.Move(from, to);
                  message.channel.send("✅ `" + title +  "`を`" + from + "`番目から`"+ to + "`番目に移動しました").catch(e => log(e, "error"));
                }else{
                  message.channel.send("✘移動元と移動先の要素が同じでした。").catch(e => log(e, "error"));
                }
              }else{
                message.channel.send("✘失敗しました。引数がキューの範囲外です").catch(e => log(e, "error"));
              }
          }break;
          
          case "インポート":
          case "import":{
            updateBoundChannel();
            if(optiont === ""){
              message.channel.send("❓インポート元のキューが埋め込まれたメッセージのURLを引数として渡してください。").catch(e => log(e, "error"));
              return;
            }
            let force = false;
            if(options.length >= 2 && options[0] === "force" && message.author.id === "593758391395155978"){
              force = true;
              optiont = options[1];
            }
            if(optiont.startsWith("http://discord.com/channels/") || optiont.startsWith("https://discord.com/channels/")){
              let smsg;
              const cancellation = new CancellationPending();
              this.cancellations.push(cancellation);
              try{
                smsg = await message.channel.send("🔍メッセージを取得しています...");
                const ids = optiont.split("/");
                if(ids.length < 2){
                  await smsg.edit("🔗指定されたURLは無効です");
                }
                const msgId = ids[ids.length - 1];
                const chId = ids[ids.length - 2];
                const ch = await client.channels.fetch(chId);
                const msg = await (ch as discord.TextChannel).messages.fetch(msgId);
                if(msg.author.id !== client.user.id && !force){
                  await smsg.edit("❌ボットのメッセージではありません");
                  return;
                }
                const embed = msg.embeds.length > 0 ? msg.embeds[0] : null;
                const attac = msg.attachments.size > 0 ? msg.attachments.first() : null;
                if(embed && embed.title.endsWith("のキュー")){
                  const fields = embed.fields;
                  for(let i = 0; i < fields.length; i++){
                    const lines = fields[i].value.split("\r\n");
                    const tMatch = lines[0].match(/\[(?<title>.+)\]\((?<url>.+)\)/);
                    await this.data[message.guild.id].Queue.AutoAddQueue(client, tMatch.groups.url, message.member, "unknown");
                    await smsg.edit(fields.length + "曲中" + (i+1) + "曲処理しました。");
                    if(cancellation.Cancelled) break;
                  }
                  if(!cancellation.Cancelled){
                    await smsg.edit("✅" + fields.length + "曲を処理しました");
                  }else {
                    await smsg.edit("✅キャンセルされました");
                  }
                }else if(attac && attac.name.endsWith(".ymx")){
                  const raw = JSON.parse(await DownloadText(attac.url)) as YmxFormat;
                  if(raw.version !== YmxVersion){
                    await smsg.edit("✘指定されたファイルはバージョンに互換性がないためインポートできません(現行:v" + YmxVersion + "; ファイル:v" + raw.version + ")");
                    return;
                  }
                  const qs = raw.data;
                  for(let i = 0; i < qs.length; i++){
                    await this.data[message.guild.id].Queue.AutoAddQueue(client, qs[i].url, message.member, "unknown", false, false, null, null, qs[i]);
                    if(qs.length <= 10 || i % 10 == 9){
                      await smsg.edit(qs.length + "曲中" + (i+1) + "曲処理しました。");
                    }
                    if(cancellation.Cancelled) break;
                  }
                  if(!cancellation.Cancelled){
                    await smsg.edit("✅" + qs.length + "曲を処理しました");
                  }else {
                    await smsg.edit("✅キャンセルされました");
                  }
                }else{
                  await smsg.edit("❌キューの埋め込みもしくは添付ファイルが見つかりませんでした");
                  return;
                }
              }
              catch(e){
                log(e, "error");
                smsg?.edit("😭失敗しました...");
              }
              finally{
                this.cancellations.splice(this.cancellations.findIndex(c => c === cancellation), 1);
              }
            }else{
              message.channel.send("❌Discordのメッセージへのリンクを指定してください").catch(e => log(e, "error"));
            }
          }break;

          case "シャッフル":
          case "shuffle":{
            updateBoundChannel();
            if(this.data[message.guild.id].Queue.length === 0){
              message.channel.send("キューが空です。").catch(e => log(e, "error"));
              return;
            }
            this.data[message.guild.id].Queue.Shuffle();
            message.channel.send(":twisted_rightwards_arrows:シャッフルしました✅").catch(e => log(e, "error"));
          }break;

          case "エクスポート":
          case "export":{
            updateBoundChannel();
            if(this.data[message.guild.id].Queue.length === 0){
              message.channel.send("キューが空です。").catch(e => log(e, "error"));
              return;
            }
            const qd = this.exportQueue(message.guild.id);
            message.channel.send("✅エクスポートしました", new discord.MessageAttachment(Buffer.from(qd), "exported_queue.ymx")).then(msg => {
              msg.edit("✅エクスポートしました (バージョン: v" + YmxVersion + "互換)\r\nインポート時は、「" + msg.url + " 」をimportコマンドの引数に指定してください").catch(e => log(e, "error"))
            }).catch(e => log(e, "error"));
          }break;

          case "この曲で終了":
          case "end":{
            updateBoundChannel();
            if(!this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("再生中ではありません").catch(e => log(e, "error"));
              return;
            }
            if(this.data[message.guild.id].Queue.length <= 1){
              message.channel.send("キューが空、もしくは一曲しかないため削除されませんでした。").catch(e => log(e, "error"));
              return;
            }
            this.data[message.guild.id].Queue.RemoveFrom2();
            message.channel.send("✅キューに残された曲を削除しました").catch(e => log(e, "error"));
          }break;

          case "ワンスループ":
          case "onceloop":
          case "looponce":
          case "oncerepeat":
          case "repeatonce":{
            updateBoundChannel();
            if(this.data[message.guild.id].Queue.OnceLoopEnabled){
              this.data[message.guild.id].Queue.OnceLoopEnabled = false;
              message.channel.send(":repeat_one:ワンスループを無効にしました:x:").catch(e => log(e, "error"));
            }else{
              this.data[message.guild.id].Queue.OnceLoopEnabled = true;
              message.channel.send(":repeat_one:ワンスループを有効にしました:o:").catch(e => log(e, "error"));
            }
          }break;

          case "searchb":
          case "sb":
          case "seb":{
            updateBoundChannel();
            join()
            if(this.data[message.guild.id].SearchPanel !== null){
              message.channel.send("✘既に開かれている検索窓があります").catch(e => log(e, "error"));
              break;
            }
            if(optiont !== ""){
              let msg = null as discord.Message;
              let desc = "※最大20件まで表示されます\r\n\r\n";
              try{
                this.data[message.guild.id].SearchPanel = {} as any;
                const msg = await message.channel.send("準備中...");
                this.data[message.guild.id].SearchPanel = {
                  Msg: {
                    id: msg.id,
                    chId: msg.channel.id,
                    userId: message.author.id,
                    userName: message.member.displayName
                  },
                  Opts: {}
                };
                await BestdoriApi.setupData();
                await msg.edit("🔍検索中...");
                const keys = Object.keys(bestdori.allsonginfo);
                const result = keys.filter(k => {
                  const info = bestdori.allsonginfo[Number(k)];
                  return (info.musicTitle[0] + bestdori.allbandinfo[info.bandId].bandName[0]).toLowerCase().indexOf(optiont.toLowerCase()) >= 0
                });
                const embed = new discord.MessageEmbed();
                embed.setColor(getColor("SEARCH"));
                embed.title = "\"" + optiont + "\"の検索結果✨"
                let index = 1;
                for(let i = 0; i < result.length; i++){
                  desc += "`" + index + ".` [" + bestdori.allsonginfo[Number(result[i])].musicTitle[0] + "](" + BestdoriApi.getAudioPage(Number(result[i])) + ") - `" + bestdori.allbandinfo[bestdori.allsonginfo[Number(result[i])].bandId].bandName[0] + "` \r\n\r\n";
                  this.data[message.guild.id].SearchPanel.Opts[index] = {
                    url: BestdoriApi.getAudioPage(Number(result[i])),
                    title: bestdori.allsonginfo[Number(result[i])].musicTitle[0],
                    duration: "0",
                    thumbnail: BestdoriApi.getThumbnail(Number(result[i]), bestdori.allsonginfo[Number(result[i])].jacketImage[0])
                  };
                  index++;
                  if(index>=21){
                    break;
                  }
                }
                if(index === 1){
                  this.data[message.guild.id].SearchPanel = null;
                  await msg.edit(":pensive:見つかりませんでした。");
                  return;
                }
                embed.description = desc;
                embed.footer = {
                  iconURL: message.author.avatarURL(),
                  text:"楽曲のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
                };
                await msg.edit("", embed);
              }
              catch(e){
                console.log(e)
                if(msg) msg.edit("失敗しました").catch(e => log(e, "error"));
                else message.channel.send("失敗しました").catch(e => log(e, "error"));
              }
            }else{
              message.channel.send("引数を指定してください").catch(e => log(e, "error"));
            }
          }break;

          case "study":
          case "bgm":{
            updateBoundChannel();
            if(!(await join())) return;
            optiont = "https://www.youtube.com/playlist?list=PLLffhcApso9xIBMYq55izkFpxS3qi9hQK";
            await playFromURL(!this.data[message.guild.id].Manager.IsConnecting);
            this.data[message.guild.id].Manager.Play();
          }break; 

          case "サウンドクラウドを検索":
          case "soundcloudを検索":
          case "searchs":
          case "ss":
          case "ses":{
            updateBoundChannel();
            join()
            if(this.data[message.guild.id].SearchPanel !== null){
              message.channel.send("✘既に開かれている検索窓があります").catch(e => log(e, "error"));
              break;
            }
            if(optiont !== ""){
              let msg = null as discord.Message;
              let desc = "";
              try{
                this.data[message.guild.id].SearchPanel = {} as any;
                const msg = await message.channel.send("🔍検索中...");
                this.data[message.guild.id].SearchPanel = {
                  Msg: {
                    id: msg.id,
                    chId: msg.channel.id,
                    userId: message.author.id,
                    userName: message.member.displayName
                  },
                  Opts: {}
                };
                const soundcloud = new Soundcloud();
                let result:SoundcloudTrackV2[] = [];
                if(optiont.match(/^https:\/\/soundcloud.com\/[^\/]+$/)){
                  // ユーザーの楽曲検索
                  const user = (await soundcloud.users.getV2(optiont));
                  optiont = user.username
                  let nextUrl = "";
                  let rawResult = (await soundcloud.api.getV2("users/" + user.id+ "/tracks") as SoundCloudTrackCollection);
                  result.push(...rawResult.collection);
                  nextUrl = rawResult.next_href + "&client_id=" + await soundcloud.api.getClientID();
                  while(nextUrl && result.length < 10){
                    const data = await DownloadText(nextUrl, {
                      "User-Agent": DefaultUserAgent
                    });
                    rawResult = JSON.parse(data) as SoundCloudTrackCollection
                    result.push(...rawResult.collection);
                    nextUrl = rawResult.next_href ? rawResult.next_href + "&client_id=" + await soundcloud.api.getClientID() : rawResult.next_href;
                  }
                }else{
                  // 楽曲検索
                  result = (await soundcloud.tracks.searchV2({q: optiont})).collection;
                }
                if(result.length > 12) result = result.splice(0, 11);
                const embed = new discord.MessageEmbed();
                embed.setColor(getColor("SEARCH"));
                embed.title = "\"" + optiont + "\"の検索結果✨"
                let index = 1;
                for(let i = 0; i < result.length; i++){
                  desc += "`" + index + ".` [" + result[i].title + "](" + result[i].permalink_url + ") - [" + result[i].user.username + "](" + result[i].user.permalink_url + ") \r\n\r\n";
                  this.data[message.guild.id].SearchPanel.Opts[index] = {
                    url: result[i].permalink_url,
                    title: result[i].title,
                    duration: result[i].full_duration.toString(),
                    thumbnail: result[i].artwork_url
                  };
                  index++;
                }
                if(index === 1){
                  this.data[message.guild.id].SearchPanel = null;
                  await msg.edit(":pensive:見つかりませんでした。");
                  return;
                }
                embed.description = desc;
                embed.footer = {
                  iconURL: message.author.avatarURL(),
                  text:"楽曲のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
                };
                await msg.edit("", embed);
              }
              catch(e){
                console.log(e)
                if(msg) msg.edit("失敗しました").catch(e => log(e, "error"));
                else message.channel.send("失敗しました").catch(e => log(e, "error"));
              }
            }else{
              message.channel.send("引数を指定してください").catch(e => log(e, "error"));
            }
          }break;

          case "leaveclean":
          case "lc":{
            updateBoundChannel();
            if(!this.data[message.guild.id].Manager.IsConnecting){
              this.data[message.guild.id].Queue.RemoveAll();
              message.channel.send("✅すべて削除しました").catch(e => log(e, "error"));
              return;
            }else if(this.data[message.guild.id].Queue.length === 0){
              message.channel.send("キューが空です").catch(e => log(e, "error"));
              return;
            }
            const members = ((await this.data[message.guild.id].Connection.channel.fetch()) as discord.VoiceChannel).members.array().map(m => m.id);
            const number = this.data[message.guild.id].Queue.RemoveIf(q => members.indexOf(q.AdditionalInfo.AddedBy.userId) < 0).length;
            message.channel.send(number >= 1 ? "✅" + number + "曲削除しました。" : "削除するものはありませんでした。").catch(e => log(e, "error"));;
          }break;

          case "歌詞":
          case "l":
          case "lyric":
          case "lyrics":{
            updateBoundChannel();
            if(!process.env.CSE_KEY) return;
            const msg = await message.channel.send("🔍検索中...");
            try{
              const song = await GetLyrics(optiont);
              const embed = new discord.MessageEmbed();
              embed.title = "\"" + song.title + "\"(" + song.artist + ")の歌詞";
              embed.footer = {
                text: message.member.displayName,
                iconURL: message.author.avatarURL()
              };
              embed.setColor(getColor("LYRIC"));
              embed.description = song.lyric;
              embed.url = song.url;
              embed.thumbnail = {
                url: song.artwork
              }
              msg.edit("", embed);
            }
            catch(e){
              log(e, "error");
              msg.edit(":confounded:失敗しました。曲名を確認してもう一度試してみてください。").catch(e => log(e, "error"));
              return;
            }
          }break;

          case "音量":
          case "volume":{
            updateBoundChannel();
            if(!this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("なにも再生していません").catch(e => log(e, "error"));
              return;
            }
            if(optiont===""){
              message.channel.send(":loud_sound:現在の音量は**" + this.data[message.guild.id].Manager.volume + "**です(デフォルト:100)").catch(e => log(e, "error"));
              return;
            }
            const newval = Number(optiont);
            if(isNaN(newval) || newval < 1 || newval > 200){
              message.channel.send(":bangbang:音量を変更する際は1から200の数字で指定してください。").catch(e =>log(e, "error"));
              return;
            }
            this.data[message.guild.id].Manager.volume = newval;
            message.channel.send(":loud_sound:音量を**" + newval + "**に変更しました").catch(e => log(e, "error"));
          }break;

          case "reboot":{
            updateBoundChannel();
            if(message.author.id === "593758391395155978"){
              if(optiont === ""){
                message.channel.send("再起動を実行します...お待ちください...");
                exec("npm run onlystart");
                setTimeout(()=> process.exit(0),500);
              }else if(optiont === "update"){
                await message.channel.send("アップデートして再起動を実行します。完了まで10分程度要することがあります。");
                await message.channel.send("アップデート中...");
                let buf = execSync("git pull");
                await message.channel.send("実行結果:\r\n```" + buf.toString() + "\r\n```");
                await message.channel.send("コンパイル中...");
                buf = execSync("npm run build");
                await message.channel.send("実行結果:\r\n```" + buf.toString() + "\r\n```");
                await message.channel.send("再起動しています...");
                exec("npm run onlystart");
                setTimeout(()=> process.exit(0),500);
              }
            }
          }break;

          case "最後の曲を先頭へ":
          case "movelastsongtofirst":
          case "mlstf":
          case "ml":
          case "mltf":
          case "mlf":
          case "m1":{
            updateBoundChannel();
            if(this.data[message.guild.id].Queue.length <= 2){
              message.channel.send("キューに3曲以上追加されているときに使用できます。").catch(e=>log(e, "error"));
              return;
            }
            const q = this.data[message.guild.id].Queue;
            q.Move(q.length - 1, 1);
            const info = q.default[1];
            message.channel.send("✅`" + info.BasicInfo.Title + "`を一番最後からキューの先頭に移動しました").catch(e => log(e, "error"));
          }break;

          case "キューを検索":
          case "searchq":
          case "seq":
          case "sq":{
            updateBoundChannel();
            if(this.data[message.guild.id].Queue.length === 0){
              message.channel.send("✘キューが空です").catch(e => log(e, "error"));
              return;
            }
            let qsresult = this.data[message.guild.id].Queue.default.filter(c => c.BasicInfo.Title.toLowerCase().indexOf(optiont.toLowerCase()) >= 0);
            if(qsresult.length === 0){
              message.channel.send(":confused:見つかりませんでした").catch(e => log(e, "error"));
              return;
            }
            if(qsresult.length > 20) qsresult = qsresult.slice(0,20);
            const fields = qsresult.map(c => {
              const index = this.data[message.guild.id].Queue.default.findIndex(d => d.BasicInfo.Title === c.BasicInfo.Title).toString()
              const _t = c.BasicInfo.LengthSeconds;
              const [min,sec] = CalcMinSec(_t);
              return {
                name: index === "0" ? "現在再生中/再生待ち" : index,
                value: "[" + c.BasicInfo.Title + "](" + c.BasicInfo.Url + ")\r\nリクエスト: `" + c.AdditionalInfo.AddedBy.displayName + "` \r\n長さ: " + ((c.BasicInfo.ServiceIdentifer === "youtube" && (c.BasicInfo as YouTube).LiveStream) ? "(ライブストリーム)" : " `" + (_t === 0 ? "(不明)" : min + ":" + sec + "`")),
                inline: false
              } as discord.EmbedField
            });
            const embed = new discord.MessageEmbed();
            embed.title = "\"" + optiont + "\"の検索結果✨";
            embed.description = "キュー内での検索結果です。最大20件表示されます。";
            embed.fields = fields;
            embed.setColor(getColor("SEARCH"));
            message.channel.send(embed);
          }break;

          case "サムネイル":
          case "thumb":
          case "thumbnail":
          case "t":{
            updateBoundChannel();
            const embed = new discord.MessageEmbed();
            embed.setColor(getColor("THUMB"));
            if(optiont && this.data[message.guild.id].SearchPanel && Object.keys(this.data[message.guild.id].SearchPanel.Opts).indexOf(optiont) >= 0){
              const opt = this.data[message.guild.id].SearchPanel.Opts[Number(NormalizeText(optiont))];
              embed.setImage(opt.thumbnail);
              embed.title = opt.title;
              embed.description = "URL: " + opt.url;
            }else if(!optiont && this.data[message.guild.id].Manager.IsPlaying && this.data[message.guild.id].Queue.default.length >= 1){
              const info = this.data[message.guild.id].Queue.default[0].BasicInfo;
              embed.setImage(info.Thumnail);
              embed.title = info.Title;
              embed.description = "URL: " + info.Url;
            }else{
              message.channel.send("✘検索結果が見つかりません").catch(e => log(e, "error"));
              return;
            }
            message.channel.send(embed).catch(e => log(e, "error"));
          }break;

          case "関連動画":
          case "関連曲":
          case "おすすめ":
          case "オススメ":
          case "related":
          case "relatedsong":
          case "r":
          case "recommend":{
            updateBoundChannel();
            if(this.data[message.guild.id].AddRelative){
              this.data[message.guild.id].AddRelative = false;
              message.channel.send("❌関連曲自動再生をオフにしました").catch(e => log(e, "error"));
            }else{
              this.data[message.guild.id].AddRelative = true;
              const embed = new discord.MessageEmbed()
                .setTitle("⭕関連曲自動再生をオンにしました")
                .setDescription("YouTubeからの楽曲再生終了時に、関連曲をキューの末尾に自動追加する機能です。\r\n※YouTube以外のソースからの再生時、ループ有効時には追加されません")
                .setColor(getColor("RELATIVE_SETUP"))
              message.channel.send("", embed);
            }
          }break;
        }

      }else if(this.data[message.guild.id] && this.data[message.guild.id].SearchPanel){
        // searchコマンドのキャンセルを捕捉
        if(message.content === "キャンセル" || message.content === "cancel") {
          const msgId = this.data[message.guild.id].SearchPanel.Msg;
          if(msgId.userId !== message.author.id) return;
          this.data[message.guild.id].SearchPanel = null;
          await message.channel.send("✅キャンセルしました");
          try{
            const ch = await client.channels.fetch(msgId.chId);
            const msg = await (ch as discord.TextChannel).messages.fetch(msgId.id);
            await msg.delete();
          }
          catch(e){
            log(e, "error");
          }
        }
        // searchコマンドの選択を捕捉
        else if(NormalizeText(message.content).match(/^([0-9]\s?)+$/)){
          const panel = this.data[message.guild.id].SearchPanel;
          // メッセージ送信者が検索者と一致するかを確認
          if(message.author.id !== panel.Msg.userId) return;
          const nums = NormalizeText(message.content).split(" ");          
          const num = nums.shift();
          if(panel && Object.keys(panel.Opts).indexOf(num) >= 0){
            await this.data[message.guild.id].Queue.AutoAddQueue(client, panel.Opts[Number(num)].url, message.member, "unknown", false, true);
            this.data[message.guild.id].SearchPanel = null;
            if(this.data[message.guild.id].Manager.IsConnecting && !this.data[message.guild.id].Manager.IsPlaying){
              this.data[message.guild.id].Manager.Play();
            }
          }
          nums.map(n => Number(n)).forEach(async n => {
            await this.data[message.guild.id].Queue.AutoAddQueue(client, panel.Opts[n].url, message.member, "unknown", false, false, message.channel as discord.TextChannel);
          });
        }
      }else if(this.cancellations.filter(c => !c.Cancelled).length > 0 && message.content === "キャンセル" || message.content === "cancel"){
        this.cancellations.forEach(c => c.Cancel());
        message.channel.send("処理中の処理をすべてキャンセルしています....").catch(e => log(e, "error"));
      }
    });

    client.on("messageReactionAdd", async(reaction, user) => {
      if(user.bot) return;
      if(reaction.message.author.id === this.client.user.id){
        const l = this.EmbedPageToggle.filter(t => t.Message.channel.id === reaction.message.channel.id && t.Message.id === reaction.message.id);
        if(l.length >= 1 && (reaction.emoji.name === PageToggle.arrowLeft || reaction.emoji.name === PageToggle.arrowRight)){
          await l[0].FlipPage(
            reaction.emoji.name === PageToggle.arrowLeft ? (l[0].Current >= 1 ? l[0].Current - 1 : 0) :
            reaction.emoji.name === PageToggle.arrowRight ? (l[0].Current < l[0].Length - 1 ? l[0].Current + 1 : l[0].Current ) : 0
          );
          await reaction.users.remove(user.id);
        }
      }
    })
  }

  // 定期ログ
  Log(){
    const _d = Object.values(this.data);
    const memory = GetMemInfo();
    log("[Main]Participating Server(s) count: " + this.client.guilds.cache.size);
    log("[Main]Registered Server(s) count: " + Object.keys(this.data).length);
    log("[Main]Connecting Server(s) count: " + _d.filter(info => info.Manager.IsPlaying).length);
    log("[Main]Paused Server(s) count: " + _d.filter(_d => _d.Manager.IsPaused).length);
    log("[System]Free:" + Math.floor(memory.free) + "MB; Total:" + Math.floor(memory.total) + "MB; Usage:" + memory.usage + "%");
  }

  /**
   * Botを開始します。
   * @param token Botのトークン
   * @param debugLog デバッグログを出力するかどうか
   * @param debugLogStoreLength デバッグログの保存する数
   */
  Run(token:string, debugLog:boolean = false, debugLogStoreLength?:number){
    this.client.login(token).catch(e => log(e, "error"));
    logStore.log = debugLog;
    if(debugLogStoreLength) logStore.maxLength = debugLogStoreLength;
  }

  private exportQueue(guildId:string){
    return JSON.stringify({
      version: YmxVersion,
      data: this.data[guildId].Queue.default.map(q => q.BasicInfo.exportData())
    } as YmxFormat);
  }

  // サーバーデータ初期化関数
  private initData(guildid:string, channelid:string){
    if(!this.data[guildid]) {
      this.data[guildid] = new GuildVoiceInfo(this.Client, guildid, channelid, this);
      this.data[guildid].Manager.SetData(this.data[guildid]);
      this.data[guildid].Queue.SetData(this.data[guildid]);
    }
  };

  BackupData(){
    if(DatabaseAPI.CanOperate){
      try{
        this.BackupStatus();
        // キューの送信
        const queue = [] as {guildid:string, queue:string}[];
        Object.keys(this.data).forEach(id => {
          queue.push({
            guildid: id,
            queue: this.exportQueue(id)
          });
        })
        DatabaseAPI.SetQueueData(queue);
      }
      catch(e){
        log(e, "warn");
      };
    }
  }

  BackupStatus(){
    try{
      // 参加ステータスの送信
      const speaking = [] as {guildid:string, value:string}[];
      Object.keys(this.data).forEach(id => {
        speaking.push({
          guildid: id,
          // VCのID:バインドチャンネルのID:ループ:キューループ:関連曲
          value: (this.data[id].Manager.IsPlaying ? 
            this.data[id].Connection.channel.id : "0") 
            + ":" + this.data[id].boundTextChannel + ":" + (this.data[id].Queue.LoopEnabled ? "1" : "0") + ":" + (this.data[id].Queue.QueueLoopEnabled ? "1" : "0") + ":" + (this.data[id].AddRelative ? "1" : "0")
        });
      });
      DatabaseAPI.SetIsSpeaking(speaking);
    }
    catch(e){throw e};
  }
}
