import type { CommandArgs } from ".";
import type { YouTube } from "../AudioSource";
import type { CommandMessage } from "../Component/CommandMessage";
import type { EmbedField } from "eris";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class Searchq extends BaseCommand {
  constructor(){
    super({
      name: "キュー内を検索",
      alias: ["searchq", "seq", "sq"],
      description: "キュー内を検索します。引数にキーワードを指定します。",
      unlist: false,
      category: "playlist",
      examples: "seq milk boy",
      usage: "seq <キーワード>",
      argument: [{
        type: "string",
        name: "keyword",
        description: "検索したい楽曲のキーワード",
        required: true
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.server.updateBoundChannel(message);
    if(options.server.queue.length === 0){
      message.reply("✘キューが空です").catch(e => Util.logger.log(e, "error"));
      return;
    }
    let qsresult = options.server.queue
      .filter(c => c.BasicInfo.Title.toLowerCase().includes(options.rawArgs.toLowerCase()))
      .concat(
        options.server.queue
          .filter(c => c.BasicInfo.Url.toLowerCase().includes(options.rawArgs.toLowerCase()))
      );
    if(qsresult.length === 0){
      message.reply(":confused:見つかりませんでした").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(qsresult.length > 20) qsresult = qsresult.slice(0, 20);
    const fields = qsresult.map(c => {
      const index = options.server.queue.findIndex(d => d.BasicInfo.Title === c.BasicInfo.Title).toString();
      const _t = c.BasicInfo.LengthSeconds;
      const [min, sec] = Util.time.CalcMinSec(_t);
      return {
        name: index === "0" ? "現在再生中/再生待ち" : index,
        value: `[${c.BasicInfo.Title}](${c.BasicInfo.Url})\r\nリクエスト: \`${c.AdditionalInfo.AddedBy.displayName}\` \r\n長さ: ${
          (c.BasicInfo.ServiceIdentifer === "youtube" && (c.BasicInfo as YouTube).LiveStream) ? "(ライブストリーム)" : ` \`${_t === 0 ? "(不明)" : `${min}:${sec}`}\`)`
        }`,
        inline: false
      } as EmbedField;
    });
    const embed = new Helper.MessageEmbedBuilder()
      .setTitle(`"${options.rawArgs}"の検索結果✨`)
      .setDescription("キュー内での検索結果です。最大20件表示されます。")
      .setFields(...fields)
      .setColor(getColor("SEARCH"))
      .toEris()
    ;
    message.reply({embeds: [embed]});
  }
}
