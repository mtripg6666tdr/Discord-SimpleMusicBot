import * as discord from "discord.js";
import * as ytdl from "ytdl-core";
import * as ytsr from "ytsr";
import { GuildVoiceInfo } from "./definition";
import { AddQueue } from "./util";

export class MusicBot {
  private client = new discord.Client();
  private data:{[key:string]:GuildVoiceInfo} = {};

  constructor(){
    const client = this.client;
    
    client.on("ready", ()=> console.log("Ready"));

    client.on("message", async message => {
      if(message.author.bot) return;
      if(message.mentions.has(client.user)) message.channel.send("使い方は、`" + this.data[message.guild.id].PersistentPref.Prefix + "command`で確認できます");
      if(message.content.startsWith(this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">")){
        const msg_spl = message.content.substr(1, message.content.length - 1).split(" ");
        const command = msg_spl[0];
        const optiont = msg_spl.length > 1 ? message.content.substring(command.length + (this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">").length + 1, message.content.length) : "";
        const options = msg_spl.length > 1 ? msg_spl.slice(1, msg_spl.length) : [];
        // サーバーデータ初期化関数
        const initData = ()=> {
          if(!this.data[message.guild.id]) {
            this.data[message.guild.id] = new GuildVoiceInfo(client, message);
            this.data[message.guild.id].Manager.SetData(this.data[message.guild.id]);
          }
        };
        // VC参加関数
        const join = async():Promise<boolean>=>{
          // すでにVC入ってるよ～
          if(message.member.voice.channel.members.has(client.user.id)){
            return true;
          }
          if(message.member.voice.channelID != null){
            const msg = await message.channel.send(":electric_plug:接続中...");
            try{
              const connection = await message.member.voice.channel.join()
              this.data[message.guild.id].Connection = connection;
              await msg.edit(":+1:ボイスチャンネル:speaker:`" + message.member.voice.channel.name + "`に接続しました!");
              return true
            }
            catch(e){
              console.error(e);
            }
          }else{
            await message.channel.send("✘ボイスチャンネルに参加してからコマンドを送信してください。");
            return false;
          }
        };
        // 初期化
        initData();
        // テキストチャンネルバインド
        this.data[message.guild.id].boundTextChannel = message.channel.id;
        switch(command){
          case "command":{
            const embed = new discord.MessageEmbed();
            embed.title = "コマンド一覧";
            embed.description = "コマンドの一覧です(実装順)。コマンドプレフィックスは、`" + this.data[message.guild.id].PersistentPref.Prefix + "`です。";
            embed.addField("help", "ヘルプを表示します。", true);
            embed.addField("join", "ボイスチャンネルに参加します。", true);
            embed.addField("search", "曲をYouTubeで検索します。", true);
            embed.addField("play, p", "キュー内の楽曲を再生します。引数としてYouTubeのURLが指定された場合、それをキューの先頭に追加して再生します。", true);
            embed.addField("pause, stop", "再生を一時停止します。", true);
            embed.addField("leave, disconnect, dc", "ボイスチャンネルから切断します。", true);
            embed.addField("nowplaying, np", "現在再生中の曲の情報を表示します。", true);
            embed.addField("queue, q", "キューを表示します。", true);
            embed.addField("reset", "サーバーの設定やデータを削除して初期化します。", true);
            embed.addField("skip, s", "現在再生中の曲をスキップします", true);
            embed.addField("loop", "トラックごとのループを設定します。",true);
            embed.addField("loopqueue, queueloop", "キュー内のループを設定します。", true);
            message.channel.send(embed);
          }break;
          case "help":{
            const embed = new discord.MessageEmbed();
            embed.title = "適当なみゅーじっくぼっと:notes:";
            embed.description = "ワケあってみょんさんが超適当に作ったみゅーじっくぼっと:robot:";
            embed.addField("作者", "[mtripg6666tdr](https://github.com/mtripg6666tdr)");
            embed.addField("れぽじとり","https://github.com/mtripg6666tdr/Discord-SimpleMusicBot");
            embed.addField("一言","開発中のためバグ等あるのでお気になさらず");
            message.channel.send(embed);
          }; break;
          case "join":{
            if(message.member.voice.channel.members.has(client.user.id)){
              message.channel.send("✘すでにボイスチャンネルに接続中です。");
            }else{
              join();
            }
          }; break;
          case "search":{
            if(!join()) return;
            if(this.data[message.guild.id].SearchPanel !== null){
              message.channel.send("✘既に開かれている検索窓があります");
              break;
            }
            if(optiont){
              const msg = await message.channel.send("🔍検索中...");
              try{
                const result = await ytsr.default(optiont, {
                  limit:10,
                  gl: "JP",
                  hl: "ja"
                });
                this.data[message.guild.id].SearchPanel = {
                  Msg: {
                    id: msg.id,
                    chId: msg.channel.id
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
                console.error(e);
                message.channel.send("✘内部エラーが発生しました");
              }
            }
          } break;
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
            if(!join()) {
              message.channel.send("ボイスチャンネルに参加してからコマンドを送信してください:relieved:");
              return;
            }
            // すでに再生中じゃん
            if(this.data[message.guild.id].Manager.IsPlaying && !this.data[message.guild.id].Manager.IsPaused) {
              message.channel.send("すでに再生中です:round_pushpin:");
              return;
            }
            // 引数ついてたらそれ優先
            if(optiont !== ""){
              if(ytdl.validateURL(optiont)){
                this.data[message.guild.id].Queue.AddQueueFirst(optiont);
                this.data[message.guild.id].Manager.Play();
              }else{
                message.channel.send("有効なURLを指定してください。キーワードで再生する場合はsearchコマンドを使用してください。");
                return;
              }
            // ついてないからキューから再生
            }else{
              this.data[message.guild.id].Manager.Play();
            }
          } break;
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
            this.data[message.guild.id].Connection = null;
            message.channel.send(":postbox: 正常に切断しました");
          }break;
          case "np":
          case "nowplaying":{
            // そもそも再生状態じゃないよ...
            if(!this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("再生中ではありません");
              return;
            }
            const _s = Math.floor(this.data[message.guild.id].Manager.CurrentTime / 1000);
            const sec = _s % 60;
            const min = (_s - sec) / 60;
            const _t = Number(this.data[message.guild.id].Manager.CurrentVideoInfo.lengthSeconds);
            const tsec = _t % 60;
            const tmin = (_t - tsec) / 60;
            const info = this.data[message.guild.id].Manager.CurrentVideoInfo;
            const embed = new discord.MessageEmbed();
            embed.title = "現在再生中の曲:musical_note:";
            const progress = Math.floor(_s / _t * 20);
            var progressBar = "";
            for(var i = 1 ; i < progress; i++){
              progressBar += "=";
            }
            progressBar += "●";
            for(var i = progress + 1; i <= 20; i++){
              progressBar += "=";
            }
            embed.description = "[" + info.title + "](" + info.video_url + ")\r\n" + progressBar + " `" + min + ":" + sec + "/" + tmin + ":" + tsec + "`";
            embed.addField(":asterisk:概要", info.description.length > 350 ? info.description.substring(0, 300) + "..." : info.description);
            embed.addField("⭐評価", ":+1:" + info.likes + "/:-1:" + info.dislikes);
            message.channel.send(embed);
          }break;
          case "q":
          case "queue":{
            const msg = await message.channel.send(":eyes: キューを確認しています。お待ちください...");
            const fields:{name:string, value:string}[] = [];
            const queue = this.data[message.guild.id].Queue;
            for(var i = 0; i < queue.length; i++){
              const info = (await ytdl.getInfo(queue.default[i], {lang: "ja"})).videoDetails;
              fields.push({
                name: i.toString(),
                value: "[" + info.title + "](" + queue.default[i] + ")"
              });
            }
            const embed = new discord.MessageEmbed({
              title: message.guild.name + "のキュー",
              fields: fields,
              footer: {
                text: queue.length + "曲 | トラックループ:" + (queue.LoopEnabled ? "⭕" : "❌") + " | キューループ:" + (queue.QueueLoopEnabled ? "⭕" : "❌")
              }
            });
            msg.edit("", embed);
          }break;
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
          case "s":
          case "skip":{
            if(!this.data[message.guild.id].Manager.IsPlaying){
              message.channel.send("再生中ではありません");
              return;
            }
            this.data[message.guild.id].Manager.Stop();
            this.data[message.guild.id].Queue.Next();
            this.data[message.guild.id].Manager.Play();
            message.channel.send(":track_next:スキップしました:white_check_mark:")
          }break;
          case "loop":{
            if(this.data[message.guild.id].Queue.LoopEnabled){
              this.data[message.guild.id].Queue.LoopEnabled = false;
              message.channel.send(":repeat_one:トラックリピートを無効にしました:x:");
            }else{
              this.data[message.guild.id].Queue.LoopEnabled = true;
              message.channel.send(":repeat_one:トラックリピートを有効にしました:o:");
            }
          }break;
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
          case "rm":
          case "remove":{
            if(options.length == 0){
              message.channel.send("引数に消去する曲のオフセット(番号)を入力してください。");
              return;
            }
            if(options.indexOf("0") >= 0) {
              message.channel.send("現在再生中の楽曲を削除することはできません。");
              return;
            }
            const dels = Array.from(new Set(options.sort().reverse()));
            for(var i = 0; i < dels.length; i++){
              this.data[message.guild.id].Queue.RemoveAt(Number(dels[i]));
            }
            message.channel.send("🚮" + dels.join(",") + "番目の曲を削除しました");
          }break;
        }
      // searchコマンドのキャンセルを捕捉
      }else if(message.content === "キャンセル" || message.content === "cancel") {
        if(this.data[message.guild.id].SearchPanel !== null){
          const msgId = this.data[message.guild.id].SearchPanel.Msg;
          this.data[message.guild.id].SearchPanel = null;
          await message.channel.send("✅キャンセルしました");
          try{
            const ch = await client.channels.fetch(msgId.chId);
            const msg = await (ch as discord.TextChannel).messages.fetch(msgId.id);
            await msg.delete();
          }
          catch(e){
            console.error(e);
          }
        }
      // searchコマンドの選択を捕捉
      }else if(message.content.match(/^[0-9]+$/) && this.data[message.guild.id].SearchPanel){
        const panel = this.data[message.guild.id].SearchPanel;
        const num = Number(message.content);
        if(panel && Object.keys(panel.Opts).indexOf(message.content) >= 0){
          await AddQueue(client, this.data[message.guild.id], panel.Opts[num]);
          this.data[message.guild.id].SearchPanel = null;
          if(this.data[message.guild.id].Manager.IsConnecting && !this.data[message.guild.id].Manager.IsPlaying){
            this.data[message.guild.id].Manager.Play();
          }
        }
      }
    });
  }

  Run(token:string){
    this.client.login(token);
  }
}