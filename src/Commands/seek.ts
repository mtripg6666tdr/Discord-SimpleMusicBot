import { CommandArgs, CommandInterface, SlashCommandArgument } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { log } from "../Util";

export default class Seek implements CommandInterface {
  name = "シーク";
  alias = ["seek"];
  description = "楽曲をシークします。";
  unlist = true;
  category = "player";
  examples = "シーク 0:30";
  usage = "検索 <時間(秒数または時間:分:秒の形式で)>";
  argument = [{
    type: "string",
    name: "keyword",
    description: "シーク先の時間",
    required: true
  }] as SlashCommandArgument[];
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const server = options.data[message.guild.id];
    // そもそも再生状態じゃないよ...
    if(!server.Player.IsPlaying || server.Player.preparing){
      await message.reply("再生中ではありません").catch(e => log(e, "error"));
      return;
    }else if(server.Player.CurrentAudioInfo.LengthSeconds === 0){
      await message.reply(":warning:シーク先に対応していない楽曲です").catch(e => log(e, "error"));
      return;
    }
    const time = (function(rawTime){
      if(rawTime.match(/^(\d+:)*\d+$/)){
        return rawTime.split(":").map(d => Number(d)).reduce((prev, current) => prev * 60 + current);
      }else{
        return NaN;
      }
    })(options.rawArgs);
    if(time > server.Player.CurrentAudioInfo.LengthSeconds || isNaN(time)){
      await message.reply(":warning:シーク先の時間が正しくありません").catch(e => log(e, "error"))
      return;
    }
    try{
      const response = await message.reply(":rocket:シークしています...");
      server.Player.Stop();
      await server.Player.Play(time);
      await response.edit(":white_check_mark:シークしました").catch(e => log(e, "error"));
    }
    catch(e){
      await message.channel.send(":astonished:シークに失敗しました")
    }
  }
}