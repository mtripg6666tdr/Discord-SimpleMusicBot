import * as discord from "discord.js";
import { CommandArgs, CommandInterface, SlashCommandArgument } from ".";
import { YouTube } from "../AudioSource/youtube";
import { CommandMessage } from "../Component/CommandMessage"
import { PageToggle } from "../Component/PageToggle";
import { getColor } from "../Util/colorUtil";
import { CalcHourMinSec, CalcMinSec, log } from "../Util/util";

export default class Queue implements CommandInterface {
  name = "キュー";
  alias = ["キューを表示", "再生待ち", "queue", "q"];
  description = "キューを表示します。";
  unlist = false;
  category = "playlist";
  argument = [{
    type: "integer",
    name: "page",
    description: "表示するキューのページを指定することができます",
    required: false
  }] as SlashCommandArgument[];
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const msg = await message.reply(":eyes: キューを確認しています。お待ちください...");
    const queue = options.data[message.guild.id].Queue;
    if(queue.length === 0){
      msg.edit(":face_with_raised_eyebrow:キューは空です。").catch(e => log(e, "error"));
      return;
    }
    // 合計所要時間の計算
    let totalLength = queue.LengthSeconds;
    let _page = options.rawArgs === "" ? 1 : Number(options.rawArgs);
    if(isNaN(_page)) _page = 1;
    if(queue.length > 0 && _page > Math.ceil(queue.length / 10)){
      msg.edit(":warning:指定されたページは範囲外です").catch(e => log(e, "error"));
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
        const [min,sec] = CalcMinSec(_t);
        fields.push({
          name: i !== 0 ? i.toString() : options.data[message.guild.id].Manager.IsPlaying ? "現在再生中" : "再生待ち",
          value: "[" + q.BasicInfo.Title + "](" + q.BasicInfo.Url + ") \r\n"
          +"長さ: `" + ((q.BasicInfo.ServiceIdentifer === "youtube" && (q.BasicInfo as YouTube).LiveStream) ? "ライブストリーム" : min + ":" + sec) + " ` \r\n"
          +"リクエスト: `" + q.AdditionalInfo.AddedBy.displayName + "` "
          + q.BasicInfo.npAdditional()
        });
      }
      const [thour, tmin, tsec] = CalcHourMinSec(totalLength);
      return new discord.MessageEmbed()
        .setTitle(message.guild.name + "のキュー")
        .setDescription("`" + page + "ページ目(" + totalpage + "ページ中)`")
        .addFields(fields)
        .setAuthor(options.client.user.username, options.client.user.avatarURL())
        .setFooter(queue.length + "曲 | 合計:" + thour + ":" + tmin + ":" + tsec + " | トラックループ:" + (queue.LoopEnabled ? "⭕" : "❌") + " | キューループ:" + (queue.QueueLoopEnabled ? "⭕" : "❌"))
        .setThumbnail(message.guild.iconURL())
        .setColor(getColor("QUEUE"));
    }

    // 送信
    await msg.edit({content: null, embeds:[getQueueEmbed(_page)]}).catch(e => log(e, "error"));
    if(totalpage > 1){
      options.EmbedPageToggle.push((await PageToggle.init(msg, (n) => getQueueEmbed(n + 1), totalpage, _page - 1)).SetFresh(true));
    }
  }
}