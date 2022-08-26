import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Mv extends BaseCommand {
  constructor(){
    super({
      name: "移動",
      alias: ["mv", "move"],
      description: "曲を指定された位置から指定された位置までキュー内で移動します。2番目の曲を5番目に移動したい場合は`mv 2 5`のようにします。",
      unlist: false,
      category: "playlist",
      examples: "移動 2 5",
      usage: "移動 <from> <to>",
      argument: [{
        type: "integer",
        name: "from",
        description: "移動元のインデックス。キューに併記されているものです",
        required: true
      }, {
        type: "integer",
        name: "to",
        description: "移動先のインデックス。キューに併記されているものです",
        required: true
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.args.length !== 2){
      message.reply("✘引数は`移動したい曲の元のオフセット(番号) 移動先のオフセット(番号)`のように指定します。").catch(e => Util.logger.log(e, "error"));
      return;
    }else if(options.args.includes("0") && options.server.player.isPlaying){
      message.reply("✘音楽の再生中(および一時停止中)は移動元または移動先に0を指定することはできません。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const from = Number(options.args[0]);
    const to = Number(options.args[1]);
    const q = options.server.queue;
    if(
      from >= 0 && from <= q.length
      && to >= 0 && to <= q.length
    ){
      const title = q.get(from).BasicInfo.Title;
      if(from !== to){
        q.move(from, to);
        message.reply("✅ `" + title + "`を`" + from + "`番目から`" + to + "`番目に移動しました").catch(e => Util.logger.log(e, "error"));
      }else{
        message.reply("✘移動元と移動先の要素が同じでした。").catch(e => Util.logger.log(e, "error"));
      }
    }else{
      message.reply("✘失敗しました。引数がキューの範囲外です").catch(e => Util.logger.log(e, "error"));
    }
  }
}
