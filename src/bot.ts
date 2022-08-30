import type { CommandArgs } from "./Commands";
import type { YmxFormat } from "./Structure";

import * as discord from "eris";

import { CommandsManager } from "./Commands";
import { CommandMessage } from "./Component/CommandMessage";
import { PageToggle } from "./Component/PageToggle";
import { ResponseMessage } from "./Component/ResponseMessage";
import { YmxVersion } from "./Structure";
import { Util } from "./Util";
import { MusicBotBase } from "./botBase";
import { NotSendableMessage } from "./definition";

/**
 * 音楽ボットの本体
 */
export class MusicBot extends MusicBotBase {
  // クライアントの初期化
  protected readonly _client = null as discord.Client;
  private readonly _addOn = new Util.addOn.AddOn();
  private _isReadyFinished = false;

  constructor(token:string, protected readonly maintenance:boolean = false){
    super(maintenance);

    this._client = new discord.Client(token, {
      intents: [
        // サーバーを認識する
        "guilds",
        // サーバーのメッセージを認識する
        "guildMessages",
        // サーバーのボイスチャンネルのステータスを確認する
        "guildVoiceStates"
      ],
      restMode: true,
    });

    this.client
      .on("ready", this.onReady.bind(this))
      .on("messageCreate", this.onMessageCreate.bind(this))
      .on("interactionCreate", this.onInteractionCreate.bind(this))
      .on("voiceChannelJoin", this.onVoiceChannelJoin.bind(this))
      .on("voiceChannelLeave", this.onVoiceChannelLeave.bind(this))
      .on("error", this.onError.bind(this))
    ;
  }

  private async onReady(){
    const client = this._client;
    this._addOn.emit("ready", client);
    this.Log("Socket connection is ready now");
    if(this._isReadyFinished) return;

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
          this.data[id]["_boundTextChannel"] = cid;
          this.data[id].queue.loopEnabled = !!loop;
          this.data[id].queue.queueLoopEnabled = !!qloop;
          this.data[id].AddRelative = !!related;
          this.data[id].equallyPlayback = !!equallypb;
          try{
            for(let j = 0; j < queue.data.length; j++){
              await this.data[id].queue.autoAddQueue(client, queue.data[j].url, queue.data[j].addBy, "unknown", false, false, null, null, queue.data[j]);
            }
            if(vid !== "0"){
              const vc = client.getChannel(vid) as discord.VoiceChannel;
              this.data[id].connection = await vc.join({
                selfDeaf: true,
              });
              await this.data[id].player.play();
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
        PageToggle.Organize(this._embedPageToggle, 5);
        this.backupData();
      };
      setTimeout(tick, 1 * 60 * 1000);
    }
    this.Log("Interval jobs set up successfully");

    // Command instance preparing
    CommandsManager.Instance.Check();

    // Finish initializing
    this._isReadyFinished = true;
    this.Log("Bot is ready now");
  }

  private async onMessageCreate(message:discord.Message){
    this._addOn.emit("messageCreate", message);
    if(this.maintenance){
      if(!Util.config.adminId || message.author.id !== Util.config.adminId) return;
    }
    // botのメッセやdm、およびnewsは無視
    if(!this._isReadyFinished || message.author.bot || !(message.channel instanceof discord.TextChannel)) return;
    // データ初期化
    const server = this.initData(message.guildID, message.channel.id);
    // プレフィックスの更新
    server.updatePrefix(message as discord.Message<discord.TextChannel>);
    if(message.content === `<@${this._client.user.id}>`){
      // メンションならば
      await this._client.createMessage(
        message.channel.id,
        `コマンドの一覧は、\`/command\`で確認できます。\r\nメッセージでコマンドを送信する場合のプレフィックスは\`${server.persistentPref.Prefix}\`です。`
      )
        .catch(e => this.Log(e, "error"));
      return;
    }
    const prefix = server.persistentPref.Prefix;
    const messageContent = Util.string.NormalizeText(message.content);
    if(messageContent.startsWith(prefix) && messageContent.length > prefix.length){
      // コマンドメッセージを作成
      const commandMessage = CommandMessage.createFromMessage(message as discord.Message<discord.TextChannel>, prefix.length);
      // コマンドを解決
      const command = CommandsManager.Instance.resolve(commandMessage.command);
      if(!command) return;
      // 送信可能か確認
      if(!Util.eris.channel.checkSendable(message.channel as discord.TextChannel, this._client.user.id)){
        try{
          await this._client.createMessage(message.channel.id, {
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
      await command.run(commandMessage, this.createCommandRunnerArgs(commandMessage.guild.id, commandMessage.options, commandMessage.rawOptions));
    }else if(server.searchPanel){
      // searchコマンドのキャンセルを捕捉
      if(message.content === "キャンセル" || message.content === "cancel"){
        const msgId = this.data[message.channel.guild.id].searchPanel.Msg;
        if(msgId.userId !== message.author.id) return;
        this.data[message.channel.guild.id].searchPanel = null;
        await this._client.createMessage(message.channel.id, "✅キャンセルしました");
        try{
          const ch = this._client.getChannel(msgId.chId);
          const msg = (ch as discord.TextChannel).messages.get(msgId.id);
          await msg.delete();
        }
        catch(e){
          this.Log(e, "error");
        }
      }
      // searchコマンドの選択を捕捉
      else if(Util.string.NormalizeText(message.content).match(/^([0-9]\s?)+$/)){
        const panel = server.searchPanel;
        if(!panel) return;
        // メッセージ送信者が検索者と一致するかを確認
        if(message.author.id !== panel.Msg.userId) return;
        const nums = Util.string.NormalizeText(message.content).split(" ");
        const optsKey = Object.keys(panel.Opts);
        if(nums.some(num => !optsKey.includes(num))) return;
        const responseMessage = (this._client.getChannel(panel.Msg.chId) as discord.TextChannel).messages.get(panel.Msg.id);
        await server.playFromSearchPanelOptions(nums, message.channel.guild.id, ResponseMessage.createFromMessage(responseMessage, panel.Msg.commandMessage));
      }
    }else if(message.content === "キャンセル" || message.content === "cancel"){
      const result = server.cancelAll();
      if(!result) return;
      await message.channel.createMessage({
        messageReference: {
          messageID: message.id,
        },
        content: "処理中の処理をすべてキャンセルしています....",
      })
        .catch(e => this.Log(e, "error"));
    }
  }

  private async onInteractionCreate(interaction:discord.Interaction){
    this._addOn.emit("interactionCreate", interaction);
    if(!Util.eris.interaction.interactionIsCommandOrComponent(interaction)) return;
    if(this.maintenance){
      if(!Util.config.adminId || interaction.member?.id !== Util.config.adminId) return;
    }
    if(interaction.member?.bot) return;
    // データ初期化
    const channel = interaction.channel as discord.TextChannel;
    const server = this.initData(channel.guild.id, channel.id);
    // コマンドインタラクション
    if(interaction instanceof discord.CommandInteraction){
      this.Log("reveived command interaction");
      if(!(interaction.channel instanceof discord.TextChannel)){
        await interaction.createMessage("テキストチャンネルで実行してください");
        return;
      }
      // 送信可能か確認
      if(!Util.eris.channel.checkSendable(interaction.channel, this._client.user.id)){
        await interaction.createMessage(NotSendableMessage);
        return;
      }
      // コマンドを解決
      const command = CommandsManager.Instance.resolve(interaction.data.name);
      if(command){
        // 遅延リプライ
        await interaction.defer();
        // メッセージライクに解決してコマンドメッセージに 
        const commandMessage = CommandMessage.createFromInteraction(interaction) as CommandMessage;
        // プレフィックス更新
        server.updatePrefix(commandMessage);
        // コマンドを実行
        await command.run(commandMessage, this.createCommandRunnerArgs(commandMessage.guild.id, commandMessage.options, commandMessage.rawOptions));
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
          const l = this._embedPageToggle.filter(t =>
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
            const { embed, messageActions } = Util.effects.getCurrentEffectPanel(interaction.member.avatarURL, this.data[(interaction.channel as discord.TextChannel).guild.id]);
            mes.edit({
              content: "",
              embeds: [embed.toEris()],
              components: [messageActions]
            }).catch(er => Util.logger.log(er, "error"));
          };
          switch(interaction.data.custom_id){
          case Util.effects.EffectsCustomIds.Reload:
            updateEffectPanel();
            break;
          case Util.effects.EffectsCustomIds.BassBoost:
            this.data[interaction.channel.guild.id].effectPrefs.BassBoost = !server.effectPrefs.BassBoost;
            updateEffectPanel();
            break;
          case Util.effects.EffectsCustomIds.Reverb:
            this.data[interaction.channel.guild.id].effectPrefs.Reverb = !server.effectPrefs.Reverb;
            updateEffectPanel();
            break;
          case Util.effects.EffectsCustomIds.LoudnessEqualization:
            this.data[interaction.channel.guild.id].effectPrefs.LoudnessEqualization = !server.effectPrefs.LoudnessEqualization;
            updateEffectPanel();
            break;
          }
        }
      }else if(Util.eris.interaction.compoentnInteractionDataIsSelectMenuData(interaction.data)){
        this.Log("received selectmenu interaction");
        // 検索パネル取得
        const panel = this.data[interaction.channel.guild.id].searchPanel;
        // なければ返却
        if(!panel) return;
        // インタラクションしたユーザーを確認
        if(interaction.member.id !== panel.Msg.userId) return;
        await interaction.deferUpdate();
        if(interaction.data.custom_id === "search"){
          if(interaction.data.values.includes("cancel")){
            this.data[interaction.channel.guild.id].searchPanel = null;
            await this._client.createMessage(interaction.channel.id, "✅キャンセルしました");
            await interaction.deleteOriginalMessage();
          }else{
            const message = interaction.message;
            const responseMessage = ResponseMessage.createFromInteraction(interaction, message, panel.Msg.commandMessage);
            await server.playFromSearchPanelOptions(interaction.data.values, interaction.channel.guild.id, responseMessage);
          }
        }
      }
    }
  }

  private async onVoiceChannelJoin(member:discord.Member, newChannel:discord.TextVoiceChannel){
    if(member.id !== this._client.user.id) return;
    if(member.voiceState.suppress || member.voiceState.mute){
      // VC参加
      const voiceChannel = this._client.getChannel(newChannel.id) as discord.VoiceChannel;
      voiceChannel.guild.editVoiceState({
        channelID: newChannel.id,
        suppress: false,
      }).catch(() => {
        voiceChannel.guild.members.get(this._client.user.id)
          .edit({
            mute: false
          })
          .catch(async () => {
            this._client.createMessage(this.data[newChannel.guild.id].boundTextChannel, ":sob:発言が抑制されています。音楽を聞くにはサーバー側ミュートを解除するか、[メンバーをミュート]権限を渡してください。")
              .catch(e => this.Log(e));
          });
      });
    }
  }

  private async onVoiceChannelLeave(member:discord.Member, oldChannel:discord.TextVoiceChannel){
    if(member.id !== this._client.user.id) return;
    // サーバー側の切断
    const guild = this.data[oldChannel.guild.id];
    if(!guild.connection) return;
    guild.player.disconnect();
    const bound = this._client.getChannel(guild.boundTextChannel);
    if(!bound) return;
    await this._client.createMessage(bound.id, ":postbox: 正常に切断しました").catch(e => this.Log(e));
  }

  private async onError(er:Error){
    Util.logger.log(er, "error");
    console.error(er);
    Util.logger.log("Attempt reconnecting");
    this.client.connect()
      .then(() => Util.logger.log("Reconnected!"))
      .catch(_er => {
        Util.logger.log(_er);
        console.log(_er);
        Util.logger.log("Reconnect attempt failed");
      })
    ;
  }

  /**
   * Botを開始します。
   * @param debugLog デバッグログを出力するかどうか
   * @param debugLogStoreLength デバッグログの保存する数
   */
  run(debugLog:boolean = false, debugLogStoreLength?:number){
    this._client.connect().catch(e => this.Log(e, "error"));
    Util.logger.logStore.log = debugLog;
    if(debugLogStoreLength) Util.logger.logStore.maxLength = debugLogStoreLength;
  }

  /**
   * コマンドを実行する際にランナーに渡す引数を生成します
   * @param options コマンドのパース済み引数
   * @param optiont コマンドの生の引数
   * @returns コマンドを実行する際にランナーに渡す引数
   */
  private createCommandRunnerArgs(guildId:string, options:string[], optiont:string):CommandArgs{
    return {
      embedPageToggle: this._embedPageToggle,
      args: options,
      bot: this,
      server: this.data[guildId],
      rawArgs: optiont,
      client: this._client,
      initData: this.initData.bind(this)
    };
  }
}
