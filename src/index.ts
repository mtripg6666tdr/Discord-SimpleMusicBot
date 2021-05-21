require("dotenv").config();
import * as discord from "discord.js";
import * as http from "http";
import * as ytdl from "ytdl-core";
import * as ytsr from "ytsr";
import { GuildVoiceInfo } from "./definition";
import { PlayManager } from "./PlayManager";
import { AddQueue } from "./util";

const client = new discord.Client();
const data:{[key:string]:GuildVoiceInfo} = {};

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Discord Bot is active now");
});

client.on("ready", ()=> console.log("Ready"));

client.on("message", async message => {
  if(message.author.bot) return;
  if(message.mentions.has(client.user)) message.channel.send("めんしょんすんな");
  if(message.content.startsWith(data[message.guild.id] ? data[message.guild.id].Prefix : ">")){
    const msg_spl = message.content.substr(1, message.content.length - 1).split(" ");
    const command = msg_spl[0];
    const optiont = msg_spl.length > 1 ? message.content.substring(command.length + (data[message.guild.id] ? data[message.guild.id].Prefix : ">").length + 1, message.content.length) : "";
    const options = msg_spl.length > 1 ? msg_spl.slice(1, msg_spl.length) : [];
    const initData = ()=> {
      if(!data[message.guild.id]) {
        data[message.guild.id] = {
          Prefix: ">",
          Connection:null,
          SearchPanel:null,
          Queue:[],
          Manager: new PlayManager(client, message.guild.id),
          Loop:false,
          LoopQueue:false,
          boundTextChannel: message.channel.id
        };
        data[message.guild.id].Manager.SetData(data[message.guild.id]);
      }
    };
    const join = ()=>{
      if(message.member.voice.channel.members.has(client.user.id)) return true;
      if(message.member.voice.channelID != null){
        message.member.voice.channel.join().then(connection => {
          data[message.guild.id].Connection = connection;
        }).catch(console.log);
        return true
      }else{
        message.channel.send("ボイスチャンネルに参加してからコマンドを送信してください。");
        return false;
      }
    };
    initData();
    data[message.guild.id].boundTextChannel = message.channel.id;
    switch(command){
      case "help":{
        const embed = new discord.MessageEmbed();
        embed.title = "適当なみゅーじっくぼっと";
        embed.description = "ちょう適当に作ったみゅーじっくぼっと";
        embed.addField("作者", "mtripg6666tdr");
        message.channel.send(embed);
      }; break;
      case "join":{
        join();
      }; break;
      case "search":{
        if(!join()) return;
        if(data[message.guild.id].SearchPanel !== null){
          message.channel.send("✘既に開かれている検索窓があります");
          break;
        }
        if(optiont){
          const msg = await message.channel.send("🔍Searching...");
          try{
            const result = await ytsr.default(optiont, {
              limit:10,
              gl: "JP",
              hl: "ja"
            });
            data[message.guild.id].SearchPanel = {
              Msg: {
                id: msg.id,
                chId: msg.channel.id
              },
              Opts: {}
            };
            const embed = new discord.MessageEmbed();
            embed.title = "\"" + optiont + "\"の検索結果"
            var desc = "";
            for(var i = 0; i < result.items.length; i++){
              if(result.items[i].type == "video"){
                const video = (result.items[i] as ytsr.Video);
                desc += "`" + (i+1) + ".` [" + video.title + "](" + video.url + ") `" + video.duration + "` \r\n\r\n";
                data[message.guild.id].SearchPanel.Opts[i + 1] = {
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
            message.channel.send("内部エラーが発生しました");
          }
        }
      } break;
      case "p":
      case "play":{
        // 一時停止されてるね
        if(data[message.guild.id].Manager.Dispatcher && data[message.guild.id].Manager.Dispatcher.paused){
          data[message.guild.id].Manager.Dispatcher.resume();
          return;
        }
        // キューにないし引数もない
        if(data[message.guild.id].Queue.length == 0 && optiont == "") {
          message.channel.send("再生するコンテンツがありません");
          return false;
        }
        // VCに入れない
        if(!join()) {
          message.channel.send("ボイスチャンネルに参加してからコマンドを送信してください。");
          return false;
        }
        // すでに再生中じゃん
        if(data[message.guild.id].Manager.Dispatcher !== null) {
          message.channel.send("すでに再生中です");
          return;
        }
        // 引数ついてたらそれ優先
        if(optiont !== ""){
          if(ytdl.validateURL(optiont)){
            data[message.guild.id].Queue = [optiont].concat(data[message.guild.id].Queue);
            data[message.guild.id].Manager.Play();
          }else{
            message.channel.send("有効なURLを指定してください");
            return;
          }
        // ついてないからキューから再生
        }else{
          data[message.guild.id].Manager.Play();
        }
      } break;
      case "stop":
      case "pause":{
        // そもそも再生状態じゃないよ...
        if(data[message.guild.id].Manager.Dispatcher == null || data[message.guild.id].Manager.Dispatcher.paused){
          message.channel.send("再生中ではありません");
        }
        // 停止しま～す
        data[message.guild.id].Manager.Dispatcher.pause();
        message.channel.send(":pause_button: 一時停止しました");
      }break;
      case "leave":
      case "dc":{
        // そもそも再生状態じゃないよ...
        if(data[message.guild.id].Connection == null){
          message.channel.send("再生中ではありません");
          return;
        }
        // 停止しま～す
        data[message.guild.id].Connection.disconnect();
        data[message.guild.id].Manager.Dispatcher = null;
        data[message.guild.id].Connection = null;
        message.channel.send(":postbox: 正常に切断しました");
      }break;
      case "np":
      case "nowplaying":{
        // そもそも再生状態じゃないよ...
        if(data[message.guild.id].Connection == null){
          message.channel.send("再生中ではありません");
          return;
        }
        const _s = data[message.guild.id].Manager.Dispatcher.streamTime;
        const sec = _s % 60;
        const min = (_s - sec) / 60;
        const _t = data[message.guild.id].Manager.Dispatcher.totalStreamTime;
        const tsec = _t % 60;
        const tmin = (_t - tsec) / 60;
        const info = data[message.guild.id].Manager.CurrentVideoInfo;
        const embed = new discord.MessageEmbed();
        embed.title = "現在再生中の曲";
        const progress = Math.floor(_t / _s * 20);
        var progressBar = "";
        for(var i = 1 ; i < progress; i++){
          progressBar += "=";
        }
        progressBar += "●";
        for(var i = progress + 1; i <= 20; i++){
          progressBar += "=";
        }
        embed.description = "`[" + info.title + "](" + info.video_url + ")\r\n" + progressBar + "` " + min + ":" + sec + "/" + tmin + ":" + tsec;
        embed.addField("概要", info.description.length > 1000 ? info.description.substring(0, 1000) : info.description);
        message.channel.send(embed);
      }break;
      case "q":
      case "queue":{
        const fields:{name:string, value:string}[] = [];
        const queue = data[message.guild.id].Queue;
        for(var i = 0; i < queue.length; i++){
          const info = (await ytdl.getInfo(queue[i], {lang: "ja"})).videoDetails;
          fields.push({
            name: i.toString(),
            value: "[" + info.title + "](" + queue[i] + ")"
          });
        }
        message.channel.send({embed:{
          title: message.guild.name + "のキュー",
          fields: fields,
          footer: {
            text: queue.length + "個の曲"
          }
        }});
      }break;
      case "reset":{
        data[message.guild.id] = null;
        initData();
        message.channel.send("✅サーバーの設定を初期化しました");
      }break;
    }
  }else if(message.content === "キャンセル" || message.content === "cancel") {
    if(data[message.guild.id].SearchPanel !== null){
      try{
        const ch = await client.channels.fetch(data[message.guild.id].SearchPanel.Msg.chId);
        const msg = await (ch as discord.TextChannel).messages.fetch(data[message.guild.id].SearchPanel.Msg.id);
        await msg.delete();
        data[message.guild.id].SearchPanel = null;
        await message.channel.send("✅キャンセルしました");
      }
      catch(e){
        console.error(e);
      }
    }
  }else if(message.content.match(/^[0-9]+$/) && data[message.guild.id].SearchPanel){
    const panel = data[message.guild.id].SearchPanel;
    const num = Number(message.content);
    if(panel && Object.keys(panel.Opts).indexOf(message.content) >= 0){
      await AddQueue(client, data[message.guild.id], panel.Opts[num]);
      data[message.guild.id].SearchPanel = null;
      if(data[message.guild.id].Connection !== null && data[message.guild.id].Manager.Dispatcher === null){
        data[message.guild.id].Manager.Play();
      }
    }
  }
});

client.login(process.env.TOKEN);