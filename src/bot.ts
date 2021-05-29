import * as discord from "discord.js";
import * as os from "os";
import * as ytdl from "ytdl-core";
import * as ytsr from "ytsr";
import * as ytpl from "ytpl";
import { GuildVoiceInfo } from "./definition";
import { AddQueue, CalcMinSec, CalcTime, CustomDescription, GetMBytes, GetMemInfo, GetPercentage, log, logStore, SoundCloudDescription } from "./util";

export class MusicBot {
  private client = new discord.Client();
  private data:{[key:string]:GuildVoiceInfo} = {};
  private instantiatedTime = null as Date;
  get Client(){return this.client};

  constructor(){
    this.instantiatedTime = new Date();
    const client = this.client;
    
    client.on("ready", ()=> {
      log("[Main]Main bot is ready and active now");
      client.user.setActivity({
        type: "LISTENING",
        name: "音楽"
      });
      const tick = ()=>{
        this.Log();
        setTimeout(tick, 5 * 60 * 1000);
      };
      tick();
    });

    client.on("message", async message => {
      // botのメッセやdmは無視
      if(message.author.bot || message.channel.type == "dm") return;
      
      // サーバーデータ初期化関数
      const initData = ()=> {
        if(!this.data[message.guild.id]) {
          this.data[message.guild.id] = new GuildVoiceInfo(client, message);
          this.data[message.guild.id].Manager.SetData(this.data[message.guild.id]);
        }
      };
      // データ初期化
      initData();
      
      // プレフィックス
      const pmatch = message.guild.members.resolve(client.user.id).displayName.match(/^\[(?<prefix>.)\]/);
      if(pmatch){
        if(this.data[message.guild.id].PersistentPref.Prefix !== pmatch.groups.prefix){
          this.data[message.guild.id].PersistentPref.Prefix = pmatch.groups.prefix;
          message.channel.send("🍵プレフィックスを`" + pmatch.groups.prefix + "`に変更しました").catch(e => log(e, "error"));
        }
      }else{
        this.data[message.guild.id].PersistentPref.Prefix = ">";
      }
      
      if(message.mentions.has(client.user)) message.channel.send("コマンドは、`" + (this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">") + "command`で確認できます");
      if(message.content.startsWith(this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">")){
        const msg_spl = message.content.substr(1, message.content.length - 1).split(" ");
        const command = msg_spl[0];
        const optiont = msg_spl.length > 1 ? message.content.substring(command.length + (this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">").length + 1, message.content.length) : "";
        const options = msg_spl.length > 1 ? msg_spl.slice(1, msg_spl.length) : [];
        
        log("[Main/" + message.guild.id + "]Command Prefix detected: " + message.content);
        
        // VC参加関数
        const join = async():Promise<boolean>=>{
          if(message.member.voice.channelID != null){
            // すでにVC入ってるよ～
            if(message.member.voice.channel && message.member.voice.channel.members.has(client.user.id)){
              return true;
            }
            // 入ってないね～参加しよう
            const msg = await message.channel.send(":electric_plug:接続中...");
            try{
              const connection = await message.member.voice.channel.join()
              this.data[message.guild.id].Connection = connection;
              log("[Main/" + message.guild.id + "]VC Connected to " + connection.channel.id);
              await msg.edit(":+1:ボイスチャンネル:speaker:`" + message.member.voice.channel.name + "`に接続しました!");
              return true;
            }
            catch(e){
              log(e, "error");
              //msg.edit(":sob:接続試行しましたが失敗しました...もう一度お試しください。\r\nエラー詳細\r\n```" + e + "\r\n```").catch(e => log(e, "error"));
              msg.delete().catch(e => log(e, "error"));
              return false;
            }
          }else{
            // あらメッセージの送信者さんはボイチャ入ってないん…
            await message.channel.send("✘ボイスチャンネルに参加してからコマンドを送信してください。");
            return false;
          }
        };
        const isAvailableRawAudioURL = (str:string)=>{
          const exts = [".mp3",".wav",".wma",".mov",".mp4"];
          return exts.filter(ext => str.endsWith(ext)).length > 0;
        }
        // URLから再生関数
        const playFromURL = async (first:boolean = true)=>{
          setTimeout(()=>message.suppressEmbeds(true).catch(e => log(e, "warn")),2000);
          var match:RegExpMatchArray;
          // 引数は動画の直リンクかなぁ
          if(ytdl.validateURL(optiont)){
            await AddQueue(client, this.data[message.guild.id], optiont, message.member.displayName, first, message.channel as discord.TextChannel);
            this.data[message.guild.id].Manager.Play();
          }else 
          // Discordメッセへのリンク？
          if(optiont.startsWith("http://discord.com/channels/") || optiont.startsWith("https://discord.com/channels/")){
            const smsg = await message.channel.send("🔍メッセージを取得しています...");
            try{
              const ids = optiont.split("/");
              const msgId = Number(ids[ids.length - 1]);
              const chId = Number(ids[ids.length - 2]);
              if(msgId.toString() !== "NaN" && chId.toString() !== "NaN"){
                const ch = await client.channels.fetch(ids[ids.length - 2]);
                if(ch.type === "text"){
                  const msg = await (ch as discord.TextChannel).messages.fetch(ids[ids.length - 1]);
                  if(msg.attachments.size > 0 && isAvailableRawAudioURL(msg.attachments.first().url)){
                    await AddQueue(client, this.data[message.guild.id], msg.attachments.first().url, message.member.displayName, first, message.channel as discord.TextChannel);
                    await smsg.delete();
                    this.data[message.guild.id].Manager.Play();
                    return;
                  }
                }
              }
            }
            catch(e){

            }
            await smsg.edit("✘メッセージは有効でない、もしくは指定されたメッセージには添付ファイルがありません。");
          }else 
          // Googleドライブ?
          if((match = optiont.match(/drive\.google\.com\/file\/d\/([^\/\?]+)(\/.+)?/)) && match.length >= 2){
            const id = match[1];
            await AddQueue(client, this.data[message.guild.id], "https://drive.google.com/uc?id=" + id, message.member.displayName, first, message.channel as discord.TextChannel);
            this.data[message.guild.id].Manager.Play();
            return;
          }else
          // オーディオファイルへの直リンク？
          if(isAvailableRawAudioURL(optiont)){
            await AddQueue(client, this.data[message.guild.id], optiont, message.member.displayName, first, message.channel as discord.TextChannel);
            this.data[message.guild.id].Manager.Play();
            return;
          }else 
          // SoundCloudの直リンク？
          if(optiont.match(/https?:\/\/soundcloud.com\/.+\/.+/)){
            await AddQueue(client, this.data[message.guild.id], optiont, message.member.displayName, first, message.channel as discord.TextChannel)
            this.data[message.guild.id].Manager.Play();
          }else{
            //違うならプレイリストの直リンクか？
            try{
              const id = await ytpl.getPlaylistID(optiont);
              const msg = await message.channel.send(":hourglass_flowing_sand:プレイリストを処理しています。お待ちください。");
              const result = await ytpl.default(id, {
                gl: "JP",
                hl: "ja"
              });
              for(var i = 0; i <result.items.length; i++){
                await AddQueue(client, this.data[message.guild.id], result.items[i].url, message.member.displayName);
                await msg.edit(":hourglass_flowing_sand:プレイリストを処理しています。お待ちください。" + result.items.length + "曲中" + (i + 1) + "曲処理済み。");
              }
              await msg.edit("✅" + result.items.length + "曲が追加されました。");
            }
            catch{
              // なに指定したし…
              message.channel.send("有効なURLを指定してください。キーワードで再生する場合はsearchコマンドを使用してください。");
              return;
            }
          }
        }
        // テキストチャンネルバインド
        this.data[message.guild.id].boundTextChannel = message.channel.id;

        // コマンドの処理に徹します
        switch(command){
          case "コマンド":
          case "commands":
          case "command":{
            const embed = new discord.MessageEmbed();
            embed.title = "コマンド一覧";
            embed.description = "コマンドの一覧です(実装順)。コマンドプレフィックスは、`" + this.data[message.guild.id].PersistentPref.Prefix + "`です。";
            embed.addField("ヘルプ, help", "ヘルプを表示します。", true);
            embed.addField("参加, join", "ボイスチャンネルに参加します。", true);
            embed.addField("検索, search", "曲をYouTubeで検索します。YouTubeの動画のURLを直接指定することもできます。", true);
            embed.addField("再生, play, p", "キュー内の楽曲を再生します。引数としてYouTubeの動画のURLを指定することもできます。", true);
            embed.addField("一時停止, 一旦停止, 停止, pause, stop", "再生を一時停止します。", true);
            embed.addField("切断, 終了, leave, disconnect, dc", "ボイスチャンネルから切断します。", true);
            embed.addField("現在再生中, 今の曲, nowplaying, np", "現在再生中の曲の情報を表示します。", true);
            embed.addField("キュー, 再生待ち, queue, q", "キューを表示します。", true);
            embed.addField("リセット, reset", "サーバーの設定やデータを削除して初期化します。", true);
            embed.addField("スキップ, skip, s", "現在再生中の曲をスキップします", true);
            embed.addField("ループ, loop", "トラックごとのループを設定します。",true);
            embed.addField("キューループ, loopqueue, queueloop", "キュー内のループを設定します。", true);
            embed.addField("削除, rm, remove", "キュー内の指定された位置の曲を削除します。", true);
            embed.addField("全て削除, すべて削除, rmall, allrm, removeall", "キュー内の曲をすべて削除します。", true);
            embed.addField("頭出し, rewind, gotop, top", "再生中の曲の頭出しを行います。", true);
            embed.addField("アップタイム, ping, uptime", "ボットのアップタイムおよびping時間(レイテンシ)を表示します。", true);
            embed.addField("ログ, log, システム情報, systeminfo, sysinfo", "ホストされているサーバーやプロセスに関する技術的な情報を表示します。引数を指定して特定の内容のみ取得することもできます。", true);
            embed.addField("移動, mv, move", "曲を指定された位置から指定された位置までキュー内で移動します。", true);
            message.channel.send(embed);
          }break;
          
          case "ヘルプ":
          case "help":{
            const embed = new discord.MessageEmbed();
            embed.title = client.user.username + ":notes:";
            embed.description = "高音質な音楽を再生して、Discordでのエクスペリエンスを最高にするため作られました:robot:\r\n"
            + "利用可能なコマンドを確認するには、`" + this.data[message.guild.id].PersistentPref.Prefix + "command`を使用してください。";
            embed.addField("作者", "[" + client.users.resolve("593758391395155978").username + "](https://github.com/mtripg6666tdr)");
            embed.addField("レポジトリ/ソースコード","https://github.com/mtripg6666tdr/Discord-SimpleMusicBot");
            embed.addField("サポートサーバー", "https://discord.gg/7DrAEXBMHe")
            embed.addField("現在対応している再生ソース", 
              "・YouTube(キーワード検索)\r\n"
            + "・YouTube(動画URL指定)\r\n"
            + "・YouTube(プレイリストURL指定)\r\n"
            + "・SoundCloud(楽曲ページURL指定)\r\n"
            + "・Discord(音声ファイルの添付付きメッセージのURL指定)\r\n"
            + "・Googleドライブ(音声ファイルの限定公開リンクのURL指定)\r\n"
            + "・オーディオファイルへの直URL"
            );
            message.channel.send(embed).catch(e => log(e, "error"));
          }; break;
          
          case "参加":
          case "join":{
            if(message.member.voice.channel.members.has(client.user.id)){
              message.channel.send("✘すでにボイスチャンネルに接続中です。").catch(e => log(e, "error"));
            }else{
              join();
            }
          }; break;
          
          case "検索":
          case "search":{
            if(!join()) return;
            if(ytdl.validateURL(optiont)){
              await playFromURL(!this.data[message.guild.id].Manager.IsPlaying);
              return;
            }
            if(this.data[message.guild.id].SearchPanel !== null){
              message.channel.send("✘既に開かれている検索窓があります").catch(e => log(e, "error"));
              break;
            }
            if(optiont){
              const msg = await message.channel.send("🔍検索中...");
              try{
                const result = await ytsr.default(optiont, {
                  limit:12,
                  gl: "JP",
                  hl: "ja"
                });
                this.data[message.guild.id].SearchPanel = {
                  Msg: {
                    id: msg.id,
                    chId: msg.channel.id,
                    userId: message.author.id,
                    userName: message.member.displayName
                  },
                  Opts: {}
                };
                const embed = new discord.MessageEmbed();
                embed.title = "\"" + optiont + "\"の検索結果✨"
                var desc = "";
                for(var i = 0; i < result.items.length; i++){
                  if(result.items[i].type == "video"){
                    const video = (result.items[i] as ytsr.Video);
                    desc += "`" + (i+1) + ".` [" + video.title + "](" + video.url + ") `" + video.duration + "` \r\n\r\n";
                    this.data[message.guild.id].SearchPanel.Opts[i + 1] = {
                      url: video.url,
                      title: video.title,
                      duration: video.duration
                    }
                  }
                }
                embed.description = desc;
                embed.footer = {
                  iconURL: message.author.avatarURL(),
                  text:"動画のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
                };
                msg.edit("", embed);
              }
              catch(e){
                log(e, "error");
                message.channel.send("✘内部エラーが発生しました");
              }
            }
          } break;
          
          case "再生":
          case "p":
          case "play":{
            // 一時停止されてるね
            if(this.data[message.guild.id].Manager.IsPaused){
              this.data[message.guild.id].Manager.Resume();
              message.channel.send(":arrow_forward: 再生を再開します。")
              return;
            }
            // キューにないし引数もない
            if(this.data[message.guild.id].Queue.length == 0 && optiont == "") {
              message.channel.send("再生するコンテンツがありません");
              return;
            }
            // VCに入れない
            if(!(await join())) {
              message.channel.send("ボイスチャンネルに参加してからコマンドを送信してください:relieved:");
              return;
            }
            // 引数ついてたらそれ優先
            if(optiont !== ""){
              await playFromURL(!this.data[message.guild.id].Manager.IsPlaying);
            // ついてないからキューから再生
            }else if(this.data[message.guild.id].Queue.length >= 1){
              this.data[message.guild.id].Manager.Play();
            }else{
              message.channel.send("✘キューが空です");
            }
          } break;
          
          case "一時停止":
          case "一旦停止":
          case "停止":
          case "stop":
          case "pause":{
            // そもそも再生状態じゃないよ...
            if(!this.data[message.guild.id].Manager.IsPlaying || this.data[message.guild.id].Manager.IsPaused){
              message.channel.send("再生中ではありません");
            }
            // 停止しま～す
            this.data[message.guild.id].Manager.Pause();
            message.channel.send(":pause_button: 一時停止しました");
          }break;
          
          case "切断":
          case "終了":
          case "leave":
          case "disconnect":
          case "dc":{
            // そもそも再生状態じゃないよ...
            if(!this.data[message.guild.id].Manager.IsConnecting){
              message.channel.send("再生中ではありません");
              return;
            }
            // 停止しま～す
            this.data[message.guild.id].Manager.Disconnect();
            message.channel.send(":postbox: 正常に切断しました");
          }break;
          
          case "現在再生中":
          case "今の曲":
          case "np":
          case "nowplaying":{
            // そもそも再生状態じゃないよ...
            if(!this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("再生中ではありません");
              return;
            }
            const _s = Math.floor(this.data[message.guild.id].Manager.CurrentTime / 1000);
            const _t = Number(this.data[message.guild.id].Manager.CurrentVideoInfo.lengthSeconds);
            const [min, sec] = CalcMinSec(_s);
            const [tmin,tsec] = CalcMinSec(_t);
            const info = this.data[message.guild.id].Manager.CurrentVideoInfo;
            const embed = new discord.MessageEmbed();
            var progressBar = "";
            if(_t > 0){
              embed.title = "現在再生中の曲:musical_note:";
              const progress = Math.floor(_s / _t * 20);
              for(var i = 1 ; i < progress; i++){
                progressBar += "=";
              }
              progressBar += "●";
              for(var i = progress + 1; i <= 20; i++){
                progressBar += "=";
              }
            }
            embed.description = "[" + info.title + "](" + info.video_url + ")\r\n" + progressBar + " `" + min + ":" + sec + "/" + tmin + ":" + tsec + "`";
            embed.setThumbnail(info.thumbnails[0].url);
            embed.addField(":asterisk:概要", info.description.length > 350 ? info.description.substring(0, 300) + "..." : info.description);
            embed.addField("⭐評価", ":+1:" + info.likes + "/:-1:" + info.dislikes);
            message.channel.send(embed);
          }break;
          
          case "キュー":
          case "再生待ち":
          case "q":
          case "queue":{
            const msg = await message.channel.send(":eyes: キューを確認しています。お待ちください...");
            const fields:{name:string, value:string}[] = [];
            const queue = this.data[message.guild.id].Queue;
            var totalLength = 0;
            for(var i = 0; i < queue.length; i++){
              const _t = Number(queue.default[i].info.lengthSeconds);
              const [min,sec] = CalcMinSec(_t);
              totalLength += _t;
              fields.push({
                name: i !== 0 ? i.toString() : this.data[message.guild.id].Manager.IsPlaying ? "現在再生中" : "再生待ち",
                value: "[" + queue.default[i].info.title + "](" + queue.default[i].info.video_url + ") \r\n"
                +"長さ: `" + min + ":" + sec + " ` \r\n"
                +"リクエスト: `" + queue.default[i].addedBy + "` "
              });
            }
            const [tmin, tsec] = CalcMinSec(totalLength);
            const embed = new discord.MessageEmbed({
              title: message.guild.name + "のキュー",
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
              }
            });
            msg.edit("", embed);
          }break;
          
          case "リセット":
          case "reset":{
            // VC接続中なら切断
            if(this.data[message.guild.id].Manager.IsConnecting){
              this.data[message.guild.id].Manager.Disconnect();
            }
            // サーバープリファレンスをnullに
            this.data[message.guild.id] = null;
            // データ初期化
            initData();
            message.channel.send("✅サーバーの設定を初期化しました");
          }break;
          
          case "スキップ":
          case "s":
          case "skip":{
            // そもそも再生状態じゃないよ...
            if(!this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("再生中ではありません");
              return;
            }
            this.data[message.guild.id].Manager.Stop();
            this.data[message.guild.id].Queue.Next();
            this.data[message.guild.id].Manager.Play();
            message.channel.send(":track_next:スキップしました:white_check_mark:")
          }break;
          
          case "ループ":
          case "loop":{
            if(this.data[message.guild.id].Queue.LoopEnabled){
              this.data[message.guild.id].Queue.LoopEnabled = false;
              message.channel.send(":repeat_one:トラックリピートを無効にしました:x:");
            }else{
              this.data[message.guild.id].Queue.LoopEnabled = true;
              message.channel.send(":repeat_one:トラックリピートを有効にしました:o:");
            }
          }break;
          
          case "キューループ":
          case "queueloop":
          case "loopqueue":{
            if(this.data[message.guild.id].Queue.QueueLoopEnabled){
              this.data[message.guild.id].Queue.QueueLoopEnabled = false;
              message.channel.send(":repeat:キューリピートを無効にしました:x:");
            }else{
              this.data[message.guild.id].Queue.QueueLoopEnabled = true;
              message.channel.send(":repeat:キューリピートを有効にしました:o:");
            }
          }break;
          
          case "削除":
          case "rm":
          case "remove":{
            if(options.length == 0){
              message.channel.send("引数に消去する曲のオフセット(番号)を入力してください。例えば、2番目と5番目の曲を削除したい場合、`" + this.data[message.guild.id].PersistentPref.Prefix + command + " 2 5`と入力します。");
              return;
            }
            if(options.indexOf("0") >= 0 && this.data[message.guild.id].Manager.IsPlaying) {
              message.channel.send("現在再生中の楽曲を削除することはできません。");
              return;
            }
            const dels = Array.from(new Set(
                options.map(str => Number(str)).filter(n => !isNaN(n)).sort((a,b)=>b-a)
            ));
            for(var i = 0; i < dels.length; i++){
              this.data[message.guild.id].Queue.RemoveAt(Number(dels[i]));
            }
            message.channel.send("🚮" + dels.sort((a,b)=>a-b).join(",") + "番目の曲を削除しました");
          }break;
          
          case "すべて削除":
          case "全て削除":
          case "rmall":
          case "allrm":
          case "removeall":{
            if(!message.member.voice.channel || !message.member.voice.channel.members.has(client.user.id)){
              if(!message.member.hasPermission("MANAGE_GUILD") && !message.member.hasPermission("MANAGE_CHANNELS")){
                message.channel.send("この操作を実行する権限がありません。");
                return;
              }
            }
            this.data[message.guild.id].Manager.Disconnect();
            this.data[message.guild.id].Queue.RemoveAll();
            message.channel.send("✅すべて削除しました");
          }break;
          
          case "頭出し":
          case "rewind":
          case "top":
          case "gotop":{
            if(!this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("再生中ではありません");
              return;
            }
            this.data[message.guild.id].Manager.Rewind();
            message.channel.send(":rewind:再生中の楽曲を頭出ししました:+1:")
          }break;
          
          case "アップタイム":
          case "ping":
          case "uptime":{
            const now = new Date();
            const insta = CalcTime(now.getTime() - this.instantiatedTime.getTime());
            const ready = CalcTime(now.getTime() - this.client.readyAt.getTime());
            const embed = new discord.MessageEmbed();
            embed.title = client.user.username + "のアップタイム";
            embed.addField("サーバー起動からの経過した時間", insta[0] + "時間" + insta[1] + "分" + insta[2] + "秒");
            embed.addField("Botが起動してからの経過時間", ready[0] + "時間" + ready[1] + "分" + ready[2] + "秒");
            embed.addField("レイテンシ", (new Date().getTime() - message.createdAt.getTime()) + "ミリ秒");
            embed.addField("データベースに登録されたサーバー数", Object.keys(this.data).length + "サーバー");
            message.channel.send(embed);
          }break;
          
          case "ログ":
          case "systeminfo":
          case "sysinfo":
          case "info":
          case "システム情報":
          case "log":{
            // Run default logger
            this.Log();

            if(message.author.id === "593758391395155978" && (options.indexOf("log") >= 0 || options.length == 0)){
              // Process Logs
              const logEmbed = new discord.MessageEmbed();
              logEmbed.title = "Log";
              logEmbed.description = "Last 30 bot logs\r\n```\r\n" + logStore.data.join("\r\n") + "\r\n```";
              message.channel.send(logEmbed).catch(e => log(e, "error"));
            }

            if(options.indexOf("cpu") >= 0 || options.length == 0){
              // Process CPU Info
              const cpuInfoEmbed = new discord.MessageEmbed();
              const cpus = os.cpus();
              cpuInfoEmbed.title = "CPU Info";
              for(var i = 0; i < cpus.length; i++){
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
              const memory = GetMemInfo();
              const nMem = process.memoryUsage();
              memInfoEmbed.title = "Memory Info";
              memInfoEmbed.addField("Total Memory", 
                  "Total: `" + memory.total + "MB`\r\n"
                + "Used: `" + memory.used + "MB`\r\n"
                + "Free: `" + memory.free + "MB`\r\n"
                + "Usage: `" + memory.usage + "%`"
              , true);
              var rss = GetMBytes(nMem.rss);
              var ext = GetMBytes(nMem.external);
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
            if(options.length !== 2){
              message.channel.send("✘引数は`移動したい曲の元のオフセット(番号) 移動先のオフセット(番号)`のように指定します。\r\n例えば、5番目の曲を2番目に移動したい場合は`" + this.data[message.guild.id].PersistentPref.Prefix + command + " 5 2`と入力します。").catch(e => log(e, "error"));
              return;
            }else if(options.indexOf("0") >= 0 && this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("✘音楽の再生中(および一時停止中)は移動元または移動先に0を指定することはできません。").catch(e => log(e, "error"));
              return;
            }
            const from = Number(options[0]);
            const to = Number(options[1]);
            if(
              0 <= from && from <= this.data[message.guild.id].Queue.default.length &&
              0 <= to && to <= this.data[message.guild.id].Queue.default.length
              ){
                if(from < to){
                  //要素追加
                  this.data[message.guild.id].Queue.default.splice(to + 1, 0, this.data[message.guild.id].Queue.default[from]);
                  //要素削除
                  this.data[message.guild.id].Queue.default.splice(from, 1);
                  message.channel.send("✅移動しました");
                }else if(from > to){
                  //要素追加
                  this.data[message.guild.id].Queue.default.splice(to, 0, this.data[message.guild.id].Queue.default[from]);
                  //要素削除
                  this.data[message.guild.id].Queue.default.splice(from + 1, 1);
                  message.channel.send("✅移動しました");
                }else{
                  message.channel.send("✘移動元と移動先の要素が同じでした。");
                }
              }else{
                message.channel.send("✘失敗しました。引数がキューの範囲外です");
              }
          }break;

          
          case "インポート":
          case "import":{
            if(optiont === ""){
              message.channel.send("❓インポート元のキューが埋め込まれたメッセージのURLを引数として渡してください。").catch(e => log(e, "error"));
              return;
            }
            if(optiont.startsWith("http://discord.com/channels/") || optiont.startsWith("https://discord.com/channels/")){
              var smsg;
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
                if(msg.author.id !== client.user.id){
                  await smsg.edit("❌ボットのメッセージではありません");
                  return;
                }
                if(msg.embeds.length == 0){
                  await smsg.edit("❌埋め込みが見つかりません");
                  return;
                }
                const embed = msg.embeds[0];
                if(!embed.title.endsWith("のキュー")){
                  await smsg.edit("❌キューの埋め込みが見つかりませんでした");
                  return;
                }
                const fields = embed.fields;
                for(var i = 0; i < fields.length; i++){
                  const lines = fields[i].value.split("\r\n");
                  const tMatch = lines[0].match(/\[(?<title>.+)\]\((?<url>.+)\)/);
                  await AddQueue(client, this.data[message.guild.id], tMatch.groups.url, message.member.displayName);
                  await smsg.edit(fields.length + "曲中" + (i+1) + "曲処理しました。");
                }
                await smsg.edit("✅" + fields.length + "曲を追加しました")
              }
              catch(e){
                log(e, "error");
                smsg?.edit("😭失敗しました...");
              }
            }else{
              message.channel.send("❌Discordのメッセージへのリンクを指定してください").catch(e => log(e, "error"));
            }
          }break;
        }
      }else if(this.data[message.guild.id] && this.data[message.guild.id].SearchPanel){
        // searchコマンドのキャンセルを捕捉
        if(message.content === "キャンセル" || message.content === "cancel") {
          const msgId = this.data[message.guild.id].SearchPanel.Msg;
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
        else if(message.content.match(/^[0-9]+$/)){
          const panel = this.data[message.guild.id].SearchPanel;
          // メッセージ送信者が検索者と一致するかを確認
          if(message.author.id !== panel.Msg.userId) return;
          const num = Number(message.content);
          if(panel && Object.keys(panel.Opts).indexOf(message.content) >= 0){
            await AddQueue(client, this.data[message.guild.id], panel.Opts[num].url, message.member.displayName);
            this.data[message.guild.id].SearchPanel = null;
            if(this.data[message.guild.id].Manager.IsConnecting && !this.data[message.guild.id].Manager.IsPlaying){
              this.data[message.guild.id].Manager.Play();
            }
          }
        }
      }
    });
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

  // Bot実行
  Run(token:string){
    this.client.login(token);
  }
}