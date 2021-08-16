import { execSync } from "child_process";
import * as discord from "discord.js";
import * as ytpl from "ytpl";
import { exportableCustom } from "./AudioSource/custom";
import { Command, CommandArgs } from "./Commands";
import { PageToggle } from "./Component/PageToggle";
import { CancellationPending, GuildVoiceInfo, YmxFormat, YmxVersion } from "./definition";
import { getColor } from "./Util/colorUtil";
import { DatabaseAPI } from "./Util/databaseUtil";
import {
  GetMemInfo, isAvailableRawAudioURL,
  log,
  logStore,
  NormalizeText,
  suppressMessageEmbeds
} from "./Util/util";

export class MusicBot {
  private client = new discord.Client();
  private data:{[key:string]:GuildVoiceInfo} = {};
  private instantiatedTime = null as Date;
  private versionInfo = "Could not get info";
  private cancellations = [] as CancellationPending[];
  private EmbedPageToggle:PageToggle[] = [] as PageToggle[];
  private isReadyFinished = false;
  private queueModifiedGuilds = [] as string[];
  get Toggles(){return this.EmbedPageToggle};
  get Client(){return this.client};
  get QueueModifiedGuilds(){return this.queueModifiedGuilds};
  get Version(){return this.versionInfo};
  get InstantiatedTime(){return this.instantiatedTime}; 

  private getCommandArgs(options:string[], optiont:string):CommandArgs{
    return {
      EmbedPageToggle: this.EmbedPageToggle,
      args: options,
      bot: this,
      data: this.data,
      rawArgs: optiont,
      updateBoundChannel: this.updateBoundChannel,
      client: this.client,
      Join: this.Join,
      PlayFromURL: this.PlayFromURL,
      initData: this.initData,
      cancellations: this.cancellations
    };
  }

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
        setTimeout(tick, 4 * 60 * 1000);
        PageToggle.Organize(this.EmbedPageToggle, 5);
        this.BackupData();
      };
      setTimeout(tick, 1 * 60 * 1000);
      this.isReadyFinished = true;
      log("Bot is ready");
    });

    client.on("message", async message => {
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
      
      if(message.content === "<@" + client.user.id + ">") {
        // メンションならば
        message.channel.send("コマンドは、`" + (this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">") + "command`で確認できます").catch(e => log(e, "error"));
        return;
      }
      if(message.content.startsWith(this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">")){
        const msg_spl = NormalizeText(message.content).substr(1, message.content.length - 1).split(" ");
        let command = msg_spl[0];
        let rawOptions = msg_spl.length > 1 ? message.content.substring(command.length + (this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">").length + 1, message.content.length) : "";
        let options = msg_spl.length > 1 ? msg_spl.slice(1, msg_spl.length) : [];
        
        log("[Main/" + message.guild.id + "]Command Prefix detected: " + message.content);
        
        // 超省略形を捕捉
        if(command.startsWith("http")){
          rawOptions = command;
          options.push(rawOptions);
          command = "p";
        }
        command = command.toLowerCase();

        // コマンドの処理
        await Command.Instance.resolve(command)?.run(message, this.getCommandArgs(options, rawOptions));

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

  exportQueue(guildId:string){
    return JSON.stringify({
      version: YmxVersion,
      data: this.data[guildId].Queue.map(q => q.BasicInfo.exportData())
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
        const guilds = this.queueModifiedGuilds;
        this.queueModifiedGuilds = [];
        guilds.forEach(id => {
          queue.push({
            guildid: id,
            queue: this.exportQueue(id)
          });
        });
        if(queue.length > 0){
          DatabaseAPI.SetQueueData(queue);
        }
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
          value: (this.data[id].Manager.IsPlaying && !this.data[id].Manager.IsPaused ? 
            this.data[id].Connection.channel.id : "0") 
            + ":" + this.data[id].boundTextChannel + ":" + (this.data[id].Queue.LoopEnabled ? "1" : "0") + ":" + (this.data[id].Queue.QueueLoopEnabled ? "1" : "0") + ":" + (this.data[id].AddRelative ? "1" : "0")
        });
      });
      DatabaseAPI.SetIsSpeaking(speaking);
    }
    catch(e){
      log(e, "warn");
    }
  }

  // VC参加関数
  // 成功した場合はtrue、それ以外の場合にはfalseを返します
  private async Join(message:discord.Message):Promise<boolean>{
    if(message.member.voice.channelID){
      // すでにVC入ってるよ～
      if(message.member.voice.channel && message.member.voice.channel.members.has(this.client.user.id)){
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
  private async PlayFromURL(message:discord.Message, optiont:string, first:boolean = true){
    setTimeout(()=> suppressMessageEmbeds(message, this.client).catch(e => log(e, "warn")), 4000);
    if(optiont.startsWith("http://discord.com/channels/") || optiont.startsWith("https://discord.com/channels/")){
      // Discordメッセへのリンクならば
      const smsg = await message.channel.send("🔍メッセージを取得しています...");
      try{
        const ids = optiont.split("/");
        const msgId = Number(ids[ids.length - 1]) ?? undefined;
        const chId = Number(ids[ids.length - 2]) ?? undefined;
        if(!isNaN(msgId) && !isNaN(chId)){
          const ch = await this.client.channels.fetch(ids[ids.length - 2]);
          if(ch.type === "text"){
            const msg = await (ch as discord.TextChannel).messages.fetch(ids[ids.length - 1]);
            if(msg.attachments.size > 0 && isAvailableRawAudioURL(msg.attachments.first().url)){
              await this.data[message.guild.id].Queue.AutoAddQueue(this.client, msg.attachments.first().url, message.member, "custom", first, false, message.channel as discord.TextChannel, smsg);
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
    }else if(isAvailableRawAudioURL(optiont)){
      // オーディオファイルへの直リンク？
      await this.data[message.guild.id].Queue.AutoAddQueue(this.client, optiont, message.member, "custom", first, false, message.channel as discord.TextChannel);
      this.data[message.guild.id].Manager.Play();
      return;
    }else if(optiont.indexOf("v=") < 0 && ytpl.validateID(optiont)){
      //違うならプレイリストの直リンクか？
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
        await this.data[message.guild.id].Queue.AutoAddQueue(this.client, c.url, message.member, "youtube", false, false, null, null, {
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
      this.data[message.guild.id].Manager.Play();
    }else{
      try{
        await this.data[message.guild.id].Queue.AutoAddQueue(this.client, optiont, message.member, "unknown", first, false, message.channel as discord.TextChannel);
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

  protected async updateBoundChannel(message:discord.Message){
    // テキストチャンネルバインド
    // コマンドが送信されたチャンネルを後で利用します。
    if(!this.data[message.guild.id].Manager.IsConnecting || (message.member.voice.channel && message.member.voice.channel.members.has(this.client.user.id)) || message.content.indexOf("join") >= 0){
      if(message.content !== (this.data[message.guild.id] ? this.data[message.guild.id].PersistentPref.Prefix : ">"))
      this.data[message.guild.id].boundTextChannel = message.channel.id;
    }
  }
}
