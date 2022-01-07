import type * as ytsr from "ytsr";
import type { CommandArgs, CommandInterface, SlashCommandArgument } from ".";
import type { CommandMessage } from "../Component/CommandMessage"
import { searchYouTube } from "../AudioSource";
import { log } from "../Util";

export default class Play implements CommandInterface {
  name = "再生";
  alias = ["play", "p"];
  description = "キュー内の楽曲を再生します。引数として対応しているサイトの楽曲のURLを指定することもできます。";
  unlist = false;
  category = "player";
  argument = [{
    type: "string",
    name: "keyword",
    description: "再生する動画のキーワードまたはURL。VCに未接続の場合接続してその曲を優先して再生します。接続中の場合はキューの末尾に追加します。一時停止中の場合はオプションは無視され、再生が再開されます。",
    required: false
  }] as SlashCommandArgument[];
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const server = options.data[message.guild.id];
    // 一時停止されてるね
    if(server.Player.IsPaused){
      server.Player.Resume();
      await message.reply(":arrow_forward: 再生を再開します。").catch(e => log(e, "error"))
      return;
    }
    // キューが空だし引数もないし添付ファイルもない
    if(server.Queue.length == 0 && options.rawArgs == "" && message.attachments.size === 0) {
      await message.reply("再生するコンテンツがありません").catch(e => log(e, "error"));
      return;
    }
    const wasConnected = server.Player.IsConnecting;
    // VCに入れない
    if(!(await options.JoinVoiceChannel(message))) {
      await(await message.reply("VCに参加してください")).delete();
      return;
    }
    // 引数ついてたらそれ優先
    if(options.rawArgs !== ""){
      if(options.rawArgs.startsWith("http://") || options.rawArgs.startsWith("https://")){
        for(let i = 0; i < options.args.length; i++){
          options.rawArgs = options.args[i];
          await options.PlayFromURL(message, options.rawArgs, i === 0 ? !wasConnected : false);
        }
      }else{
        const msg = await message.channel.send("🔍検索中...");
        const result = (await searchYouTube(options.rawArgs)).items.filter(it => it.type === "video");
        if(result.length === 0){
          await message.reply(":face_with_monocle:該当する動画が見つかりませんでした");
          await msg.delete();
          return;
        }
        options.rawArgs = (result[0] as ytsr.Video).url;
        await options.PlayFromURL(message, options.rawArgs, !server.Player.IsConnecting);
        await msg.delete();
      }
    // 添付ファイルを確認
    }else if(message.attachments.size >= 1){
      options.rawArgs = message.attachments.first().url;
      await options.PlayFromURL(message, options.rawArgs, !server.Player.IsConnecting);
    // なにもないからキューから再生
    }else if(server.Queue.length >= 1){
      if(!server.Player.IsPlaying){
        await message.reply("再生します");
        await server.Player.Play();
      }else{
        await message.reply("すでに再生中です");
      }
    }else{
      await message.reply("✘キューが空です").catch(e => log(e, "error"));
    }
  }
}