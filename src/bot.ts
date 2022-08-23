import type { exportableCustom } from "./AudioSource";
import type { CommandArgs } from "./Commands";
import type { YmxFormat } from "./Structure";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";
import * as discord from "eris";

import { execSync } from "child_process";

import Soundcloud from "soundcloud.ts";
import * as ytpl from "ytpl";

import { SoundCloudS } from "./AudioSource";
import { CommandsManager } from "./Commands";
import { CommandMessage } from "./Component/CommandMessage";
import { PageToggle } from "./Component/PageToggle";
import { ResponseMessage } from "./Component/ResponseMessage";
import { TaskCancellationManager } from "./Component/TaskCancellationManager";
import { GuildDataContainer, YmxVersion, LogEmitter } from "./Structure";
import { Util } from "./Util";
import { NotSendableMessage } from "./definition";

/**
 * 音楽ボットの本体
 */
export class MusicBot extends LogEmitter {
  // クライアントの初期化
  private readonly client = null as discord.Client;

  private data:{[key:string]:GuildDataContainer} = {};
  private readonly instantiatedTime = null as Date;
  private readonly versionInfo = "Could not get info" as string;
  private readonly cancellations = [] as TaskCancellationManager[];
  private readonly EmbedPageToggle:PageToggle[] = [] as PageToggle[];
  private isReadyFinished = false;
  private queueModifiedGuilds = [] as string[];
  private readonly addOn = new Util.addOn.AddOn();
  /**
   * ページトグル
   */
  get Toggles(){return this.EmbedPageToggle;}
  /**
   * クライアント
   */
  get Client(){return this.client;}
  /**
   * キューが変更されたサーバーの保存
   */
  get QueueModifiedGuilds(){return this.queueModifiedGuilds;}
  /**
   * バージョン情報  
   * (リポジトリの最終コミットのハッシュ値)
   */
  get Version(){return this.versionInfo;}
  /**
   * 初期化された時刻
   */
  get InstantiatedTime(){return this.instantiatedTime;}

  constructor(token:string, private readonly maintenance:boolean = false){
    super();
    this.client = new discord.Client(token, {intents: [
      // サーバーを認識する
      "guilds",
      // サーバーのメッセージを認識する
      "guildMessages",
      // サーバーのボイスチャンネルのステータスを確認する
      "guildVoiceStates",
    ]});
    this.SetTag("Main");
    this.instantiatedTime = new Date();
    const client = this.client;
    this.Log("bot is instantiated");
    if(maintenance){
      this.Log("bot is now maintainance mode");
    }
    try{
      this.versionInfo = execSync("git log -n 1 --pretty=format:%h").toString()
        .trim();
      this.Log(`Version: ${this.versionInfo}`);
    }
    catch{
      this.Log("Something went wrong when obtaining version", "warn");
    }

    client
      .on("ready", this.onReady.bind(this))
      .on("messageCreate", this.onMessageCreate.bind(this))
      .on("interactionCreate", this.onInteractionCreate.bind(this))
      .on("voiceStateUpdate", this.onVoiceStateUpdate.bind(this))
    ;
  }

  private async onReady(){
    const client = this.client;
    this.addOn.emit("ready", client);
    this.Log("Socket connection is ready now");
    if(this.isReadyFinished) return;

    client.on("error", er => {
      Util.logger.log(er, "error");
      console.error(er);
      Util.logger.log("Attempt reconnecting");
      client.connect()
        .then(() => Util.logger.log("Reconnected!"))
        .catch(_er => {
          Util.logger.log(_er);
          console.log(_er);
          Util.logger.log("Reconnect attempt failed");
        });
    });

    this.Log("Starting environment checking and preparation now");

    // Set activity as booting
    if(!this.maintenance){
      client.editStatus({
        type: discord.Constants.ActivityTypes.GAME,
        name: "起動中..."
      });
    }else{
      client.editStatus("dnd", {
        type: discord.Constants.ActivityTypes.GAME,
        name: "メンテナンス中..."
      });
    }

    // Recover queues
    if(Util.db.DatabaseAPI.CanOperate){
      const joinedGUildIds = [...client.guilds.values()].map(guild => guild.id);
      const queues = await Util.db.DatabaseAPI.GetQueueData(joinedGUildIds);
      const speakingIds = await Util.db.DatabaseAPI.GetIsSpeaking(joinedGUildIds);
      const queueGuildids = Object.keys(queues);
      const speakingGuildids = Object.keys(speakingIds);
      for(let i = 0; i < queueGuildids.length; i++){
        const id = queueGuildids[i];
        const queue = JSON.parse(queues[id]) as YmxFormat;
        if(
          speakingGuildids.includes(id)
          && queue.version === YmxVersion
          && speakingIds[id].includes(":")
        ){
          //VCのID:バインドチャンネルのID:ループ:キューループ:関連曲
          const [vid, cid, ..._bs] = speakingIds[id].split(":");
          const [loop, qloop, related, equallypb] = _bs.map(b => b === "1");
          this.initData(id, cid);
          this.data[id].boundTextChannel = cid;
          this.data[id].Queue.loopEnabled = !!loop;
          this.data[id].Queue.queueLoopEnabled = !!qloop;
          this.data[id].AddRelative = !!related;
          this.data[id].EquallyPlayback = !!equallypb;
          try{
            for(let j = 0; j < queue.data.length; j++){
              await this.data[id].Queue.autoAddQueue(client, queue.data[j].url, queue.data[j].addBy, "unknown", false, false, null, null, queue.data[j]);
            }
            if(vid !== "0"){
              const vc = client.getChannel(vid) as discord.VoiceChannel;
              this.data[id].Connection = await vc.join({
                selfDeaf: true,
              });
              await this.data[id].Player.play();
            }
          }
          catch(e){
            this.Log(e, "warn");
          }
        }
      }
      this.Log("Finish recovery of queues and statuses.");
    }else{
      this.Log("Cannot perform recovery of queues and statuses. Check .env file to perform this. See README for more info", "warn");
    }

    // Set activity
    if(!this.maintenance){
      client.editStatus({
        type: discord.Constants.ActivityTypes.LISTENING,
        name: "音楽"
      });

      // Set main tick
      const tick = ()=>{
        this.logGeneralInfo();
        setTimeout(tick, 4 * 60 * 1000);
        PageToggle.Organize(this.EmbedPageToggle, 5);
        this.backupData();
      };
      setTimeout(tick, 1 * 60 * 1000);
    }
    this.Log("Interval jobs set up successfully");

    // Command instance preparing
    CommandsManager.Instance.Check();

    // Finish initializing
    this.isReadyFinished = true;
    this.Log("Bot is ready now");
  }

  private async onMessageCreate(message:discord.Message){
    this.addOn.emit("messageCreate", message);
    if(this.maintenance){
      if(!Util.config.adminId || message.author.id !== Util.config.adminId) return;
    }
    // botのメッセやdm、およびnewsは無視
    if(!this.isReadyFinished || message.author.bot || !(message.channel instanceof discord.TextChannel)) return;
    // データ初期化
    this.initData(message.guildID, message.channel.id);
    // プレフィックスの更新
    this.updatePrefix(message as discord.Message<discord.TextChannel>);
    if(message.content === `<@${this.client.user.id}>`){
      // メンションならば
      await this.client.createMessage(message.channel.id, `コマンドの一覧は、\`/command\`で確認できます。\r\nメッセージでコマンドを送信する場合のプレフィックスは\`${this.data[message.guildID].PersistentPref.Prefix}\`です。`)
        .catch(e => this.Log(e, "error"));
      return;
    }
    const prefix = this.data[message.guildID].PersistentPref.Prefix;
    const messageContent = Util.string.NormalizeText(message.content);
    if(messageContent.startsWith(prefix) && messageContent.length > prefix.length){
      // コマンドメッセージを作成
      const commandMessage = CommandMessage.createFromMessage(message as discord.Message<discord.TextChannel>, prefix.length);
      // コマンドを解決
      const command = CommandsManager.Instance.resolve(commandMessage.command);
      if(!command) return;
      // 送信可能か確認
      if(!Util.eris.channel.checkSendable(message.channel as discord.TextChannel, this.client.user.id)){
        try{
          await this.client.createMessage(message.channel.id, {
            messageReference: {
              messageID: message.id,
            },
            content: NotSendableMessage,
            allowedMentions: {
              repliedUser: false
            }
          });
        }
        // eslint-disable-next-line no-empty
        catch{}
        return;
      }
      // コマンドの処理
      await command.run(commandMessage, this.createCommandRunnerArgs(commandMessage.options, commandMessage.rawOptions));
    }else if(this.data[message.channel.guild.id] && this.data[message.channel.guild.id].SearchPanel){
      // searchコマンドのキャンセルを捕捉
      if(message.content === "キャンセル" || message.content === "cancel"){
        const msgId = this.data[message.channel.guild.id].SearchPanel.Msg;
        if(msgId.userId !== message.author.id) return;
        this.data[message.channel.guild.id].SearchPanel = null;
        await this.client.createMessage(message.channel.id, "✅キャンセルしました");
        try{
          const ch = this.client.getChannel(msgId.chId);
          const msg = (ch as discord.TextChannel).messages.get(msgId.id);
          await msg.delete();
        }
        catch(e){
          this.Log(e, "error");
        }
      }
      // searchコマンドの選択を捕捉
      else if(Util.string.NormalizeText(message.content).match(/^([0-9]\s?)+$/)){
        const panel = this.data[message.channel.guild.id].SearchPanel;
        if(!panel) return;
        // メッセージ送信者が検索者と一致するかを確認
        if(message.author.id !== panel.Msg.userId) return;
        const nums = Util.string.NormalizeText(message.content).split(" ");
        const responseMessage = (this.client.getChannel(panel.Msg.chId) as discord.TextChannel).messages.get(panel.Msg.id);
        await this.playFromSearchPanelOptions(nums, message.channel.guild.id, ResponseMessage.createFromMessage(responseMessage, panel.Msg.commandMessage));
      }
    }else if(
      this.cancellations.filter(c => !c.Cancelled).length > 0
      && (message.content === "キャンセル" || message.content === "cancel")
    ){
      this.cancellations.forEach(c => c.GuildId === (message.channel.client.getChannel(message.channel.id) as discord.TextChannel).guild.id && c.Cancel());
      await this.client.createMessage(message.channel.id, {
        messageReference: {
          messageID: message.id,
        },
        content: "処理中の処理をすべてキャンセルしています....",
      })
        .catch(e => this.Log(e, "error"));
    }
  }

  private async onInteractionCreate(interaction:discord.Interaction){
    this.addOn.emit("interactionCreate", interaction);
    if(!Util.eris.interaction.interactionIsCommandOrComponent(interaction)) return;
    if(this.maintenance){
      if(!Util.config.adminId || interaction.member?.id !== Util.config.adminId) return;
    }
    if(interaction.member?.bot) return;
    // データ初期化
    const channel = interaction.channel as discord.TextChannel;
    this.initData(channel.guild.id, channel.id);
    // コマンドインタラクション
    if(interaction instanceof discord.CommandInteraction){
      this.Log("reveived command interaction");
      if(!(interaction.channel instanceof discord.TextChannel)){
        await interaction.createMessage("テキストチャンネルで実行してください");
        return;
      }
      // 送信可能か確認
      if(!Util.eris.channel.checkSendable(interaction.channel, this.client.user.id)){
        await interaction.createMessage(NotSendableMessage);
        return;
      }
      // コマンドを解決
      const command = CommandsManager.Instance.resolve(interaction.data.name);
      if(command){
        // 遅延リプライ
        await interaction.defer();
        // メッセージライクに解決してコマンドメッセージに 
        const commandMessage = CommandMessage.createFromInteraction(interaction);
        // プレフィックス更新
        this.updatePrefix(commandMessage);
        // コマンドを実行
        await command.run(commandMessage, this.createCommandRunnerArgs(commandMessage.options, commandMessage.rawOptions));
      }else{
        await interaction.createMessage("おっと！なにかが間違ってしまったようです。\r\nコマンドが見つかりませんでした。 :sob:");
      }
    // ボタンインタラクション
    }else if(interaction instanceof discord.ComponentInteraction){
      if(!(interaction.channel instanceof discord.TextChannel)) return;
      if(Util.eris.interaction.componentInteractionDataIsButtonData(interaction.data)){
        this.Log("received button interaction");
        await interaction.deferUpdate();
        if(interaction.data.custom_id === PageToggle.arrowLeft || interaction.data.custom_id === PageToggle.arrowRight){
          const l = this.EmbedPageToggle.filter(t =>
            t.Message.channelId === interaction.channel.id
            && t.Message.id === interaction.message.id);
          if(l.length >= 1){
            // ページめくり
            await l[0].FlipPage(
              interaction.data.custom_id === PageToggle.arrowLeft ? (l[0].Current >= 1 ? l[0].Current - 1 : 0) :
                interaction.data.custom_id === PageToggle.arrowRight ? (l[0].Current < l[0].Length - 1 ? l[0].Current + 1 : l[0].Current) : 0
              ,
              interaction
            );
          }else{
            await interaction.editOriginalMessage("失敗しました!");
          }
        }else{
          const updateEffectPanel = () => {
            const mes = interaction.message;
            const { embed, messageActions } = Util.effects.getCurrentEffectPanel(interaction.user.avatarURL, this.data[(interaction.channel as discord.TextChannel).guild.id]);
            mes.edit({
              content: "",
              embeds: [embed.toEris()],
              components: [messageActions]
            });
          };
          switch(interaction.data.custom_id){
          case Util.effects.EffectsCustomIds.Reload:
            updateEffectPanel();
            break;
          case Util.effects.EffectsCustomIds.BassBoost:
            this.data[interaction.channel.guild.id].EffectPrefs.BassBoost = !this.data[interaction.channel.guild.id].EffectPrefs.BassBoost;
            updateEffectPanel();
            break;
          case Util.effects.EffectsCustomIds.Reverb:
            this.data[interaction.channel.guild.id].EffectPrefs.Reverb = !this.data[interaction.channel.guild.id].EffectPrefs.Reverb;
            updateEffectPanel();
            break;
          case Util.effects.EffectsCustomIds.LoudnessEqualization:
            this.data[interaction.channel.guild.id].EffectPrefs.LoudnessEqualization = !this.data[interaction.channel.guild.id].EffectPrefs.LoudnessEqualization;
            updateEffectPanel();
            break;
          }
        }
      }else if(Util.eris.interaction.compoentnInteractionDataIsSelectMenuData(interaction.data)){
        this.Log("received selectmenu interaction");
        // 検索パネル取得
        const panel = this.data[interaction.channel.guild.id].SearchPanel;
        // なければ返却
        if(!panel) return;
        // インタラクションしたユーザーを確認
        if(interaction.member.id !== panel.Msg.userId) return;
        await interaction.deferUpdate();
        if(interaction.data.custom_id === "search"){
          if(interaction.data.values.includes("cancel")){
            this.data[interaction.channel.guild.id].SearchPanel = null;
            await this.client.createMessage(interaction.channel.id, "✅キャンセルしました");
            await interaction.deleteOriginalMessage();
          }else{
            const message = interaction.message;
            const responseMessage = ResponseMessage.createFromInteraction(interaction, message, panel.Msg.commandMessage);
            await this.playFromSearchPanelOptions(interaction.data.values, interaction.channel.guild.id, responseMessage);
          }
        }
      }
    }
  }

  private async onVoiceStateUpdate(oldState:discord.VoiceState, newState:discord.VoiceState){
    if(newState.id !== this.client.user.id) return;
    if(oldState.channelID !== newState.channelID){
      const guild = this.data[(this.client.getChannel(newState.channelID) as discord.TextChannel).guild.id];
      if(!guild) return;
      if(!newState.channelID){
        // サーバー側の切断
        if(!guild.Player.isConnecting) return;
        guild.Player.disconnect();
        const bound = this.client.getChannel(guild.boundTextChannel);
        if(!bound) return;
        await this.client.createMessage(bound.id, ":postbox: 正常に切断しました").catch(e => this.Log(e));
      }else if(!oldState.channelID && (newState.suppress || newState.mute)){
        // VC参加
        const voiceChannel = this.client.getChannel(newState.channelID) as discord.VoiceChannel;
        voiceChannel.guild.editVoiceState({
          channelID: newState.channelID,
          suppress: false,
        }).catch(() => {
          voiceChannel.guild.members.get(this.client.user.id)
            .edit({
              mute: false
            })
            .catch(async () => {
              this.client.createMessage(guild.boundTextChannel, ":sob:発言が抑制されています。音楽を聞くにはサーバー側ミュートを解除するか、[メンバーをミュート]権限を渡してください。")
                .catch(e => this.Log(e));
            });
        });
      }
    }
  }

  /**
   *  定期ログを実行します
   */
  logGeneralInfo(){
    const _d = Object.values(this.data);
    const memory = Util.system.GetMemInfo();
    Util.logger.log(`[Main]Participating: ${this.client.guilds.size}, Registered: ${Object.keys(this.data).length} Connecting: ${_d.filter(info => info.Player.isPlaying).length} Paused: ${_d.filter(__d => __d.Player.isPaused).length}`);
    Util.logger.log(`[System]Free:${Math.floor(memory.free)}MB; Total:${Math.floor(memory.total)}MB; Usage:${memory.usage}%`);
    const nMem = process.memoryUsage();
    const rss = Util.system.GetMBytes(nMem.rss);
    const ext = Util.system.GetMBytes(nMem.external);
    Util.logger.log(`[Main]Memory RSS: ${rss}MB, Heap total: ${Util.system.GetMBytes(nMem.heapTotal)}MB, Total: ${Util.math.GetPercentage(rss + ext, memory.total)}% (use systeminfo command for more info)`);
  }

  /**
   * Botを開始します。
   * @param debugLog デバッグログを出力するかどうか
   * @param debugLogStoreLength デバッグログの保存する数
   */
  run(debugLog:boolean = false, debugLogStoreLength?:number){
    this.client.connect().catch(e => this.Log(e, "error"));
    Util.logger.logStore.log = debugLog;
    if(debugLogStoreLength) Util.logger.logStore.maxLength = debugLogStoreLength;
  }

  /**
   * キューをエクスポートしてテキストにします
   */
  exportQueue(guildId:string):string{
    return JSON.stringify({
      version: YmxVersion,
      data: this.data[guildId].Queue.map(q => ({
        ...(q.BasicInfo.exportData()),
        addBy: q.AdditionalInfo.AddedBy
      })),
    } as YmxFormat);
  }

  /**
   * 接続ステータスやキューを含む全データをサーバーにバックアップします
   */
  backupData(){
    if(Util.db.DatabaseAPI.CanOperate){
      const t = Util.time.timer.start("MusicBot#BackupData");
      try{
        this.backupStatus();
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
          Util.db.DatabaseAPI.SetQueueData(queue);
        }
      }
      catch(e){
        this.Log(e, "warn");
      }
      t.end();
    }
  }

  /**
   * 接続ステータス等をサーバーにバックアップします
   */
  backupStatus(){
    const t = Util.time.timer.start("MusicBot#BackupStatus");
    try{
      // 参加ステータスの送信
      const speaking = [] as {guildid:string, value:string}[];
      Object.keys(this.data).forEach(id => {
        speaking.push({
          guildid: id,
          // VCのID:バインドチャンネルのID:ループ:キューループ:関連曲
          value: (this.data[id].Player.isPlaying && !this.data[id].Player.isPaused
            ? this.data[id].Connection.channelID : "0")
            + ":" + this.data[id].boundTextChannel
            + ":" + (this.data[id].Queue.loopEnabled ? "1" : "0")
            + ":" + (this.data[id].Queue.queueLoopEnabled ? "1" : "0")
            + ":" + (this.data[id].AddRelative ? "1" : "0")
            + ":" + (this.data[id].EquallyPlayback ? "1" : "0")
        });
      });
      Util.db.DatabaseAPI.SetIsSpeaking(speaking);
    }
    catch(e){
      this.Log(e, "warn");
    }
    t.end();
  }

  /**
   * 必要に応じてサーバーデータを初期化します
   */
  private initData(guildid:string, channelid:string){
    if(!this.data[guildid]){
      this.data[guildid] = new GuildDataContainer(this.Client, guildid, channelid, this);
      this.data[guildid].Player.setBinding(this.data[guildid]);
      this.data[guildid].Queue.setBinding(this.data[guildid]);
    }
  }

  /**
   * コマンドを実行する際にランナーに渡す引数を生成します
   * @param options コマンドのパース済み引数
   * @param optiont コマンドの生の引数
   * @returns コマンドを実行する際にランナーに渡す引数
   */
  private createCommandRunnerArgs(options:string[], optiont:string):CommandArgs{
    return {
      EmbedPageToggle: this.EmbedPageToggle,
      args: options,
      bot: this,
      data: this.data,
      rawArgs: optiont,
      updateBoundChannel: this.updateBoundChannel.bind(this),
      client: this.client,
      JoinVoiceChannel: this.joinVoiceChannel.bind(this),
      PlayFromURL: this.playFromURL.bind(this),
      initData: this.initData.bind(this),
      cancellations: this.cancellations
    };
  }

  /**
   * ボイスチャンネルに接続します
   * @param message コマンドを表すメッセージ
   * @param reply 応答が必要な際に、コマンドに対して返信で応じるか新しいメッセージとして応答するか。(デフォルトではfalse)
   * @returns 成功した場合はtrue、それ以外の場合にはfalse
   */
  private async joinVoiceChannel(message:CommandMessage, reply:boolean = false, replyOnFail:boolean = false):Promise<boolean>{
    const t = Util.time.timer.start("MusicBot#Join");
    if(message.member.voiceState.channelID){
      const targetVC = this.client.getChannel(message.member.voiceState.channelID) as discord.VoiceChannel;
      // すでにVC入ってるよ～
      if(targetVC.voiceMembers.has(this.client.user.id)){
        const connection = this.data[message.guild.id].Connection;
        if(connection){
          t.end();
          return true;
        }
      }

      // 入ってないね～参加しよう
      const msg = await ((mes:string) => {
        if(reply){
          return message.reply(mes);
        }
        else{
          return this.client.createMessage(message.channel.id, mes);
        }
      })(":electric_plug:接続中...");
      try{
        if(!targetVC.permissionsOf(this.client.user.id).has("voiceConnect")) throw new Error("ボイスチャンネルに参加できません。権限を確認してください。");
        const connection = await targetVC.join({
          selfDeaf: true,
        });
        connection
          .on("error", err => {
            Util.logger.log("[Main][Connection]" + Util.general.StringifyObject(err), "error");
            this.data[targetVC.guild.id].Player.handleError(err);
          })
          .on("pong", ping => this.data[message.guild.id].VcPing = ping)
        ;
        if(Util.config.debug){
          connection.on("debug", mes => Util.logger.log("[Main][Connection]" + mes, "debug"));
        }
        this.data[targetVC.guild.id].Connection = connection;
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
        this.data[message.guild.id].Player.disconnect();
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
  }

  /**
   * メッセージからストリームを判定してキューに追加し、状況に応じて再生を開始します
   * @param first キューの先頭に追加するかどうか
   */
  private async playFromURL(message:CommandMessage, optiont:string, first:boolean = true){
    const t = Util.time.timer.start("MusicBot#PlayFromURL");
    const server = this.data[message.guild.id];
    setTimeout(() => message.suppressEmbeds(true).catch(e => this.Log(Util.general.StringifyObject(e), "warn")), 4000);
    if(optiont.match(/^https?:\/\/(www\.|canary\.|ptb\.)?discord(app)?\.com\/channels\/[0-9]+\/[0-9]+\/[0-9]+$/)){
      // Discordメッセへのリンクならば
      const smsg = await message.reply("🔍メッセージを取得しています...");
      try{
        const ids = optiont.split("/");
        const ch = this.client.getChannel(ids[ids.length - 2]);
        if(!(ch instanceof discord.TextChannel)) throw new Error("サーバーのテキストチャンネルではありません");
        const msg = await this.client.getMessage(ch.id, ids[ids.length - 1]) as discord.Message<discord.TextChannel>;
        if(ch.guild.id !== msg.channel.guild.id) throw new Error("異なるサーバーのコンテンツは再生できません");
        if(msg.attachments.length <= 0 || !Util.fs.isAvailableRawAudioURL(msg.attachments[0]?.url)) throw new Error("添付ファイルが見つかりません");
        await server.Queue.autoAddQueue(this.client, msg.attachments[0].url, message.member, "custom", first, false, message.channel as discord.TextChannel, smsg);
        await server.Player.play();
        return;
      }
      catch(e){
        await smsg.edit(`✘追加できませんでした(${Util.general.StringifyObject(e)})`).catch(er => this.Log(er, "error"));
      }
    }else if(Util.fs.isAvailableRawAudioURL(optiont)){
      // オーディオファイルへの直リンク？
      await server.Queue.autoAddQueue(this.client, optiont, message.member, "custom", first, false, message.channel as discord.TextChannel);
      server.Player.play();
      return;
    }else if(!optiont.includes("v=") && !optiont.includes("/channel/") && ytpl.validateID(optiont)){
      //違うならYouTubeプレイリストの直リンクか？
      const id = await ytpl.getPlaylistID(optiont);
      const msg = await message.reply(":hourglass_flowing_sand:プレイリストを処理しています。お待ちください。");
      const result = await ytpl.default(id, {
        gl: "JP",
        hl: "ja",
        limit: 999 - server.Queue.length
      });
      const cancellation = new TaskCancellationManager(message.guild.id);
      this.cancellations.push(cancellation);
      const index = await server.Queue.processPlaylist(
        this.client,
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
      await server.Player.play();
    }else if(SoundCloudS.validatePlaylistUrl(optiont)){
      const msg = await message.reply(":hourglass_flowing_sand:プレイリストを処理しています。お待ちください。");
      const sc = new Soundcloud();
      const playlist = await sc.playlists.getV2(optiont);
      const cancellation = new TaskCancellationManager(message.guild.id);
      this.cancellations.push(cancellation);
      const index = await server.Queue.processPlaylist(this.client, msg, cancellation, first, "soundcloud", playlist.tracks, playlist.title, playlist.track_count, async (track) => {
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
      await server.Player.play();
    }else{
      try{
        const success = await server.Queue.autoAddQueue(this.client, optiont, message.member, "unknown", first, false, message.channel as discord.TextChannel, await message.reply("お待ちください..."));
        if(success) server.Player.play();
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
   * 状況に応じてバインドチャンネルを更新します
   * @param message 更新元となるメッセージ
   */
  private async updateBoundChannel(message:CommandMessage){
    // テキストチャンネルバインド
    // コマンドが送信されたチャンネルを後で利用します。
    if(
      !this.data[message.guild.id].Player.isConnecting
      || (message.member.voiceState.channelID && (this.client.getChannel(message.member.voiceState.channelID) as discord.VoiceChannel).voiceMembers.has(this.client.user.id))
      || message.content.includes("join")
    ){
      if(message.content !== (this.data[message.guild.id]?.PersistentPref.Prefix || ">")) this.data[message.guild.id].boundTextChannel = message.channelId;
    }
  }

  /**
   * プレフィックス更新します
   * @param message 更新元となるメッセージ
   */
  private updatePrefix(message:CommandMessage|discord.Message<discord.TextChannel>):void{
    const guild = "guild" in message ? message.guild : message.channel.guild;
    const data = this.data[guild.id];
    const current = data.PersistentPref.Prefix;
    const member = guild.members.get(this.client.user.id);
    const pmatch = (member.nick || member.username).match(/^\[(?<prefix>.)\]/);
    if(pmatch){
      if(data.PersistentPref.Prefix !== pmatch.groups.prefix){
        data.PersistentPref.Prefix = Util.string.NormalizeText(pmatch.groups.prefix);
      }
    }else if(data.PersistentPref.Prefix !== Util.config.prefix){
      data.PersistentPref.Prefix = Util.config.prefix;
    }
    if(data.PersistentPref.Prefix !== current){
      this.Log(`Prefix was set to '${this.data[guild.id].PersistentPref.Prefix}' (${guild.id})`);
    }
  }

  /**
   * 検索パネルのオプション番号を表すインデックス番号から再生します
   * @param nums インデックス番号の配列
   * @param guildid サーバーID
   * @param member 検索者のメンバー
   * @param message 検索パネルが添付されたメッセージ自体を指す応答メッセージ
   */
  private async playFromSearchPanelOptions(nums:string[], guildid:string, message:ResponseMessage){
    const t = Util.time.timer.start("MusicBot#playFromSearchPanelOptions");
    const panel = this.data[guildid].SearchPanel;
    const member = this.client.guilds.get(guildid).members.get(panel.Msg.userId);
    const num = nums.shift();
    if(Object.keys(panel.Opts).includes(num)){
      await this.data[guildid].Queue.autoAddQueue(this.client, panel.Opts[Number(num)].url, member, "unknown", false, message);
      this.data[guildid].SearchPanel = null;
      // 現在の状態を確認してVCに接続中なら接続試行
      if(member.voiceState.channelID){
        await this.joinVoiceChannel(message.command, false, false);
      }
      // 接続中なら再生を開始
      if(
        this.data[guildid].Player.isConnecting
        && !this.data[guildid].Player.isPlaying
      ){
        this.data[guildid].Player.play();
      }
    }
    const rest = nums.filter(n => Object.keys(panel.Opts).includes(n)).map(n => Number(n));
    for(let i = 0; i < rest.length; i++){
      await this.data[guildid].Queue.autoAddQueue(this.client, panel.Opts[rest[i]].url, member, "unknown", false, false, message.channel as discord.TextChannel);
    }
    t.end();
  }
}
