import type { CommandArgs } from ".";
import type { YouTube } from "../AudioSource";
import type { CommandMessage } from "../Component/CommandMessage";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import { PageToggle } from "../Component/PageToggle";
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class Queue extends BaseCommand {
  constructor(){
    super({
      name: "キュー",
      alias: ["キューを表示", "再生待ち", "queue", "q"],
      description: "キューを表示します。",
      unlist: false,
      category: "playlist",
      argument: [{
        type: "integer",
        name: "page",
        description: "表示するキューのページを指定することができます",
        required: false
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    const msg = await message.reply(":eyes: キューを確認しています。お待ちください...");
    const queue = options.server.queue;
    if(queue.length === 0){
      msg.edit(":face_with_raised_eyebrow:キューは空です。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    // 合計所要時間の計算
    const totalLength = queue.lengthSeconds;
    let _page = options.rawArgs === "" ? 1 : Number(options.rawArgs);
    if(isNaN(_page)) _page = 1;
    if(queue.length > 0 && _page > Math.ceil(queue.length / 10)){
      msg.edit(":warning:指定されたページは範囲外です").catch(e => Util.logger.log(e, "error"));
      return;
    }
    // 合計ページ数割り出し
    const totalpage = Math.ceil(queue.length / 10);
    // ページのキューを割り出す
    const getQueueEmbed = (page:number)=>{
      const fields:{name:string, value:string}[] = [];
      for(let i = 10 * (page - 1); i < 10 * page; i++){
        if(queue.length <= i){
          break;
        }
        const q = queue.get(i);
        const _t = Number(q.BasicInfo.LengthSeconds);
        const [min, sec] = Util.time.CalcMinSec(_t);
        fields.push({
          name: i !== 0 ? i.toString() : options.server.player.isPlaying ? "現在再生中" : "再生待ち",
          value: "[" + q.BasicInfo.Title + "](" + q.BasicInfo.Url + ") \r\n"
          + "長さ: `" + ((q.BasicInfo.ServiceIdentifer === "youtube" && (q.BasicInfo as YouTube).LiveStream) ? "ライブストリーム" : min + ":" + sec) + " ` \r\n"
          + "リクエスト: `" + q.AdditionalInfo.AddedBy.displayName + "` "
          + q.BasicInfo.npAdditional()
        });
      }
      const [thour, tmin, tsec] = Util.time.CalcHourMinSec(totalLength);
      return new Helper.MessageEmbedBuilder()
        .setTitle(message.guild.name + "のキュー")
        .setDescription("`" + page + "ページ目(" + totalpage + "ページ中)`")
        .addFields(...fields)
        .setAuthor({
          name: options.client.user.username,
          icon_url: options.client.user.avatarURL,
        })
        .setFooter({
          text: `${queue.length}曲 | 合計:${thour}:${tmin}:${tsec} | トラックループ:${queue.loopEnabled ? "⭕" : "❌"} | キューループ:${queue.queueLoopEnabled ? "⭕" : "❌"} | 関連曲自動再生:${options.server.AddRelative ? "⭕" : "❌"} | 均等再生:${options.server.equallyPlayback ? "⭕" : "❌"}`
        })
        .setThumbnail(message.guild.iconURL)
        .setColor(getColor("QUEUE"))
        .toEris()
      ;
    };

    // 送信
    await msg.edit({content: "", embeds: [getQueueEmbed(_page)]}).catch(e => Util.logger.log(e, "error"));
    if(totalpage > 1){
      options.embedPageToggle.push((await PageToggle.init(msg, n => getQueueEmbed(n + 1), totalpage, _page - 1)).SetFresh(true));
    }
  }
}
