import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { BaseCommand } from ".";
import { Util } from "../Util";

export default class Rm extends BaseCommand {
  constructor(){
    super({
      name: "削除",
      alias: ["消去", "rm", "remove"],
      description: "キュー内の指定された位置の曲を削除します。",
      unlist: false,
      category: "playlist",
      examples: "rm 5",
      usage: "削除 <削除する位置>",
      argument: [{
        type: "string",
        name: "index",
        description: "削除するインデックスはキューに併記されているものです。ハイフンを使って2-5のように範囲指定したり、スペースを使って1 4 8のように複数指定することも可能です。",
        required: true
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.args.length === 0){
      message.reply("引数に消去する曲のオフセット(番号)を入力してください。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(options.args.includes("0") && options.server.player.isPlaying){
      message.reply("現在再生中の楽曲を削除することはできません。");
      return;
    }
    const q = options.server.queue;
    const addition = [] as number[];
    options.args.forEach(o => {
      let match = o.match(/^(?<from>[0-9]+)-(?<to>[0-9]+)$/);
      if(match){
        const from = Number(match.groups.from);
        const to = Number(match.groups.to);
        if(!isNaN(from) && !isNaN(to) && from <= to){
          for(let i = from; i <= to; i++){
            addition.push(i);
          }
        }
      }else{
        match = o.match(/^(?<from>[0-9]+)-$/);
        if(match){
          const from = Number(match.groups.from);
          if(!isNaN(from)){
            for(let i = from; i < q.length; i++){
              addition.push(i);
            }
          }
        }else{
          match = o.match(/^-(?<to>[0-9]+)$/);
          if(match){
            const to = Number(match.groups.to);
            if(!isNaN(to)){
              for(let i = (options.server.player.isPlaying ? 1 : 0); i <= to; i++){
                addition.push(i);
              }
            }
          }
        }
      }
    });
    const indexes = options.args.concat(addition.map(n => n.toString()));
    const dels = Array.from(new Set(
      indexes.map(str => Number(str)).filter(n => !isNaN(n))
        .sort((a, b)=>b - a)
    ));
    const title = dels.length === 1 ? q.get(dels[0]).basicInfo.Title : null;
    for(let i = 0; i < dels.length; i++){
      q.removeAt(Number(dels[i]));
    }
    const resultStr = dels.sort((a, b)=>a - b).join(",");
    message.reply("🚮" + (resultStr.length > 100 ? "指定された" : resultStr + "番目の") + "曲" + (title ? ("(`" + title + "`)") : "") + "を削除しました").catch(e => Util.logger.log(e, "error"));
  }
}
