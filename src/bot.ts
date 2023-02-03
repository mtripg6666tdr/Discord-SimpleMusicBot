/*
 * Copyright 2021-2023 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

import type { CommandArgs } from "./Structure";

import * as discord from "eris";

import { CommandManager } from "./Component/CommandManager";
import { CommandMessage } from "./Component/CommandMessage";
import { PageToggle } from "./Component/PageToggle";
import { QueueManagerWithBgm } from "./Component/QueueManagerWithBGM";
import { GuildDataContainerWithBgm } from "./Structure/GuildDataContainerWithBgm";
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

  constructor(token:string, maintenance:boolean = false){
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
      compress: true,
      disableEvents: {
        CHANNEL_PINS_UPDATE: true,
        THREAD_CREATE: true,
        THREAD_UPDATE: true,
        THREAD_DELETE: true,
        THREAD_LIST_SYNC: true,
        THREAD_MEMBER_UPDATE: true,
        THREAD_MEMBERS_UPDATE: true,
        STAGE_INSTANCE_CREATE: true,
        STAGE_INSTANCE_UPDATE: true,
        STAGE_INSTANCE_DELETE: true,
      }
    });

    this.client
      .on("ready", this.onReady.bind(this))
      .on("messageCreate", this.onMessageCreate.bind(this))
      .on("interactionCreate", this.onInteractionCreate.bind(this))
      .on("voiceChannelJoin", this.onVoiceChannelJoin.bind(this))
      .on("voiceChannelLeave", this.onVoiceChannelLeave.bind(this))
      .on("voiceChannelSwitch", this.onVoiceChannelSwitch.bind(this))
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

    // add bgm tracks
    if(Util.config.bgm){
      const guildIds = Object.keys(Util.config.bgm);
      for(let i = 0; i < guildIds.length; i++){
        if(!this.client.guilds.get(guildIds[i])) continue;
        await this
          .initDataWithBgm(guildIds[i], "0", Util.config.bgm[guildIds[i]])
          .initBgmTracks()
        ;
      }
    }

    // Recover queues
    if(this.backupper){
      const joinedGuildIds = [...client.guilds.values()].map(guild => guild.id);
      const guildQueues = await this.backupper.getQueueDataFromBackup(joinedGuildIds);
      const guildStatuses = await this.backupper.getStatusFromBackup(joinedGuildIds);
      if(guildQueues && guildStatuses){
        const guildQueueIds = [...guildQueues.keys()];
        const guildStatusIds = [...guildStatuses.keys()];
        for(let i = 0; i < guildQueueIds.length; i++){
          const id = guildQueueIds[i];
          if(guildStatusIds.includes(id)){
            try{
              const server = this.initData(id, guildStatuses.get(id).boundChannelId);
              await server.importQueue(guildQueues.get(id));
              server.importStatus(guildStatuses.get(id));
            }
            catch(e){
              this.Log(e, "warn");
            }
          }
        }
        this.Log("Finish recovery of queues and statuses.");
      }
    }else{
      this.Log("Cannot perform recovery of queues and statuses. Check .env file to perform this. See README for more info", "warn");
    }

    // Set activity
    if(!this.maintenance){
      client.editStatus({
        type: discord.Constants.ActivityTypes.LISTENING,
        name: "音楽"
      });
    }
    // Set main tick
    setTimeout(() => {
      this.maintenanceTick();
      setInterval(this.maintenanceTick.bind(this), 1 * 60 * 1000);
    }, 10 * 1000);
    this.Log("Interval jobs set up successfully");

    // Command instance preparing
    await CommandManager.instance.sync(this.client);

    this.emit("beforeReady");

    // Finish initializing
    this._isReadyFinished = true;
    this.Log("Bot is ready now");
    this.emit("ready");
  }

  private async onMessageCreate(message:discord.Message){
    this._addOn.emit("messageCreate", message);
    if(this.maintenance){
      if(!Util.config.adminId || message.author.id !== Util.config.adminId) return;
    }
    // botのメッセやdm、およびnewsは無視
    if(!this._isReadyFinished || message.author.bot || !(message.channel instanceof discord.TextChannel)) return;
    if(this._rateLimitController.isRateLimited(message.member.id)) return;
    // データ初期化
    const server = this.initData(message.guildID, message.channel.id);
    // プレフィックスの更新
    server.updatePrefix(message as discord.Message<discord.TextChannel>);
    if(message.content === `<@${this._client.user.id}>`){
      // メンションならば
      await message.channel.createMessage(`コマンドの一覧は、\`/command\`で確認できます。\r\nメッセージでコマンドを送信する場合のプレフィックスは\`${server.prefix}\`です。`)
        .catch(e => this.Log(e, "error"));
      return;
    }
    const prefix = server.prefix;
    const messageContent = Util.string.NormalizeText(message.content);
    if(messageContent.startsWith(prefix) && messageContent.length > prefix.length){
      // コマンドメッセージを作成
      const commandMessage = CommandMessage.createFromMessage(message as discord.Message<discord.TextChannel>, prefix.length);
      // コマンドを解決
      const command = CommandManager.instance.resolve(commandMessage.command);
      if(!command) return;
      if(
        // BGM構成が存在するサーバー
        server instanceof GuildDataContainerWithBgm
        && (
          (
            // いまBGM再生中
            server.queue.isBGM
            && (
              // キューの編集を許可していない、またはBGM優先モード
              !server.bgmConfig.allowEditQueue || server.bgmConfig.mode === "prior"
            )
          )
          // BGMが再生していなければ、BGMオンリーモードであれば
          || server.bgmConfig.mode === "only"
        )
        // かつBGM構成で制限があるときに実行できないコマンドならば
        && command.category !== "utility" && command.category !== "bot" && command.name !== "ボリューム"
      ){
        // 無視して返却
        return;
      }
      // 送信可能か確認
      if(!Util.eris.channel.checkSendable(message.channel as discord.TextChannel, this._client.user.id)){
        try{
          await message.channel.createMessage({
            messageReference: {
              messageID: message.id,
            },
            content: NotSendableMessage,
            allowedMentions: {
              repliedUser: false
            }
          });
        }
        catch{ /* empty */ }
        return;
      }
      // コマンドの処理
      await command.run(commandMessage, this.createCommandRunnerArgs(commandMessage.guild.id, commandMessage.options, commandMessage.rawOptions));
    }else if(server.hasSearchPanel(message.member.id)){
      // searchコマンドのキャンセルを捕捉
      const panel = server.getSearchPanel(message.member.id);
      const content = Util.string.NormalizeText(message.content);
      if(message.content === "キャンセル" || message.content === "cancel"){
        panel.destroy();
      }
      // searchコマンドの選択を捕捉
      else if(content.match(/^([0-9]\s?)+$/)){
        // メッセージ送信者が検索者と一致するかを確認
        const nums = content.split(" ");
        await server.playFromSearchPanelOptions(nums, panel);
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
    if(this._rateLimitController.isRateLimited(interaction.member.id)) return;
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
      const command = CommandManager.instance.resolve(interaction.data.name);
      if(command){
        if(
          // BGM構成が存在するサーバー
          server instanceof GuildDataContainerWithBgm
          && (
            (
              // いまBGM再生中
              server.queue.isBGM
              && (
                // キューの編集を許可していない、またはBGM優先モード
                !server.bgmConfig.allowEditQueue || server.bgmConfig.mode === "prior"
              )
            )
            // BGMが再生していなければ、BGMオンリーモードであれば
            || server.bgmConfig.mode === "only"
          )
          // かつBGM構成で制限があるときに実行できないコマンドならば
          && command.category !== "utility" && command.category !== "bot" && command.name !== "ボリューム"
        ){
          // 無視して返却
          return;
        }
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
            await l[0].flipPage(
              interaction.data.custom_id === PageToggle.arrowLeft ? (l[0].Current >= 1 ? l[0].Current - 1 : 0) :
                interaction.data.custom_id === PageToggle.arrowRight ? (l[0].Current < l[0].Length - 1 ? l[0].Current + 1 : l[0].Current) : 0
              ,
              interaction
            );
          }else{
            await interaction.editOriginalMessage("失敗しました!");
          }
        }else if(interaction.data.custom_id.startsWith("skip_vote")){
          const result = server.skipSession?.vote(interaction.member);
          if(result === "voted"){
            interaction.createMessage({
              content: "投票しました",
              flags: discord.Constants.MessageFlags.EPHEMERAL,
            });
          }else if(result === "cancelled"){
            interaction.createMessage({
              content: "投票を取り消しました",
              flags: discord.Constants.MessageFlags.EPHEMERAL,
            });
          }
        }else if(interaction.data.custom_id.startsWith("cancel-last-")){
          const item = server.queue.get(server.queue.length - 1);
          const userId = interaction.data.custom_id.substring("cancel-last-".length);
          if(interaction.member.id === userId){
            server.queue.removeAt(server.queue.length - 1);
            interaction.createMessage(`🚮\`${item.basicInfo.Title}\`の追加を取り消しました`).catch(er => this.Log(er, "error"));
            interaction.message.edit({
              content: interaction.message.content,
              embeds: interaction.message.embeds,
              components: [],
            }).catch(er => this.Log(er, "error"));
          }
        }else{
          const updateEffectPanel = () => {
            const mes = interaction.message;
            const { embed, messageActions } = Util.effects.getCurrentEffectPanel(interaction.member.avatarURL, this.guildData.get((interaction.channel as discord.TextChannel).guild.id));
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
              this.guildData.get(interaction.channel.guild.id).effectPrefs.BassBoost = !server.effectPrefs.BassBoost;
              updateEffectPanel();
              break;
            case Util.effects.EffectsCustomIds.Reverb:
              this.guildData.get(interaction.channel.guild.id).effectPrefs.Reverb = !server.effectPrefs.Reverb;
              updateEffectPanel();
              break;
            case Util.effects.EffectsCustomIds.LoudnessEqualization:
              this.guildData.get(interaction.channel.guild.id).effectPrefs.LoudnessEqualization = !server.effectPrefs.LoudnessEqualization;
              updateEffectPanel();
              break;
          }
        }
      }else if(Util.eris.interaction.componentInteractionDataIsSelectMenuData(interaction.data)){
        this.Log("received selectmenu interaction");
        // 検索パネル取得
        const panel = this.guildData.get(interaction.channel.guild.id).getSearchPanel(interaction.member.id);
        // なければ返却
        if(!panel) return;
        await interaction.deferUpdate();
        if(interaction.data.custom_id === "search"){
          if(interaction.data.values.includes("cancel")){
            await panel.destroy();
          }else{
            await server.playFromSearchPanelOptions(interaction.data.values, panel);
          }
        }
      }
    }
  }

  private async onVoiceChannelJoin(member:discord.Member, newChannel:discord.TextVoiceChannel){
    if(member.id === this._client.user.id){
      // ボットが参加した際
      // ミュート状態/抑制状態なら自分で解除を試みる
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
            .catch(() => {
              this._client.createMessage(this.guildData.get(newChannel.guild.id).boundTextChannel, ":sob:発言が抑制されています。音楽を聞くにはサーバー側ミュートを解除するか、[メンバーをミュート]権限を渡してください。")
                .catch(e => this.Log(e));
            });
        });
        this.emit("onBotVoiceChannelJoin", voiceChannel);
      }
    }else if(this.guildData.has(member.guild.id)){
      const server = this.guildData.get(member.guild.id);
      server.skipSession?.checkThreshold();
      if(
        server instanceof GuildDataContainerWithBgm
          && (
            !server.connection
              || (
                server.bgmConfig.mode === "prior"
                && server.connection.channelID !== server.bgmConfig.voiceChannelId
              )
          )
          && newChannel.id === server.bgmConfig.voiceChannelId
          && !server.queue.isBGM
      ){
        // BGMターゲット
        server.playBgmTracks();
      }
    }
  }

  private async onVoiceChannelLeave(member:discord.Member, oldChannel:discord.TextVoiceChannel){
    const server = this.guildData.get(oldChannel.guild.id);
    if(!server || !server.connection) return;
    if(member.id === this._client.user.id){
      // サーバー側からのボットの切断
      this.Log(`forced to disconnect from VC (${server.connection?.channelID})`);
      server.player.disconnect();
      await this._client.createMessage(server.boundTextChannel, ":postbox: 正常に切断しました").catch(e => this.Log(e, "error"));
    }else if(oldChannel.voiceMembers.has(this._client.user.id) && oldChannel.voiceMembers.size === 1){
      if(server.queue instanceof QueueManagerWithBgm && server.queue.isBGM){
        server.player.disconnect();
      }else if(server.player.isPlaying){
        // 誰も聞いてる人がいない場合一時停止
        if(server.player.currentAudioInfo.LengthSeconds > 60 && server.player.currentAudioInfo.LengthSeconds - (server.player.currentTime / 1000) < 10){
          this.Log(`audio left less than 10sec; automatically disconnected from VC (${server.connection?.channelID})`);
          server.player.disconnect();
          if(!server.queue.onceLoopEnabled && !server.queue.loopEnabled) server.queue.next();
          await this._client.createMessage(server.boundTextChannel, ":postbox: 正常に切断しました").catch(e => this.Log(e, "error"));
        }else if(!server.player.isPaused){
          server.player.pause();
          await this._client.createMessage(server.boundTextChannel, ":pause_button:ボイスチャンネルから誰もいなくなったため一時停止しました。`再生`コマンドで再開できます。").catch(e => this.Log(e));
          const timer = setTimeout(() => {
            server.player.off("playCalled", playHandler);
            server.player.off("disconnect", playHandler);
            if(server.player.isPaused){
              this._client.createMessage(server.boundTextChannel, ":postbox: 長時間使用しなかったため、終了します").catch(e => this.Log(e, "error"));
              server.player.disconnect();
            }
          }, 10 * 60 * 1000);
          const playHandler = () => clearTimeout(timer);
          server.player.once("playCalled", playHandler);
          server.player.once("disconnect", playHandler);
        }
      }else if(server.player.finishTimeout){
        server.player.disconnect();
        await this._client.createMessage(server.boundTextChannel, ":postbox: 正常に切断しました").catch(e => this.Log(e, "error"));
      }
    }
    server.skipSession?.checkThreshold();
  }

  private async onVoiceChannelSwitch(member:discord.Member, newChannel:discord.TextVoiceChannel, oldChannel:discord.TextVoiceChannel){
    this.onVoiceChannelJoin(member, newChannel);
    if(member.id !== this.client.user.id) this.onVoiceChannelLeave(member, oldChannel);
  }

  private async onError(er:Error){
    Util.logger.log(er, "error");
    this.Log("Attempt reconnecting after waiting for a while...");
    await Util.general.wait(3000);
    this.client.connect()
      .then(() => Util.logger.log("Reconnected!"))
      .catch(_er => {
        this.Log(_er);
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
      server: this.guildData.get(guildId),
      rawArgs: optiont,
      client: this._client,
      initData: this.initData.bind(this)
    };
  }
}
