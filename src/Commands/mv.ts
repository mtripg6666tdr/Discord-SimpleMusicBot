import * as discord from "discord.js";
import { CommandArgs, CommandInterface, SlashCommandArgument } from ".";
import { CommandLike } from "../Component/CommandLike";
import { log } from "../Util/util";

export default class Mv implements CommandInterface {
  name = "移動";
  alias = ["mv", "move"];
  description = "曲を指定された位置から指定された位置までキュー内で移動します。2番目の曲を5番目に移動したい場合は`mv 2 5`のようにします。";
  unlist = false;
  category = "playlist";
  examples = "移動 2 5";
  usage = "移動 <from> <to>";
  argument = [{
    type: "integer",
    name: "from",
    description: "移動元のインデックス。キューに併記されているものです",
    required: true
  }, {
    type: "integer",
    name: "to",
    description: "移動先のインデックス。キューに併記されているものです",
    required: true
  }] as SlashCommandArgument[];
  async run(message:CommandLike, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.rawArgs.length !== 2){
      message.channel.send("✘引数は`移動したい曲の元のオフセット(番号) 移動先のオフセット(番号)`のように指定します。").catch(e => log(e, "error"));
      return;
    }else if(options.rawArgs.indexOf("0") >= 0 && options.data[message.guild.id].Manager.IsPlaying){
      message.channel.send("✘音楽の再生中(および一時停止中)は移動元または移動先に0を指定することはできません。").catch(e => log(e, "error"));
      return;
    }
    const from = Number(options.rawArgs[0]);
    const to = Number(options.rawArgs[1]);
    const q = options.data[message.guild.id].Queue;
    if(
      0 <= from && from <= q.length &&
      0 <= to && to <= q.length
      ){
        const title = q.get(from).BasicInfo.Title;
        if(from !== to){
          q.Move(from, to);
          message.channel.send("✅ `" + title +  "`を`" + from + "`番目から`"+ to + "`番目に移動しました").catch(e => log(e, "error"));
        }else{
          message.channel.send("✘移動元と移動先の要素が同じでした。").catch(e => log(e, "error"));
        }
      }else{
        message.channel.send("✘失敗しました。引数がキューの範囲外です").catch(e => log(e, "error"));
      }
  }
}