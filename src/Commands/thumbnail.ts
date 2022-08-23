import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { Helper } from "@mtripg6666tdr/eris-command-resolver";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class Thumbnail extends BaseCommand {
  constructor(){
    super({
      name: "サムネイル",
      alias: ["thumbnail", "t"],
      description: "現在再生中のサムネイルを表示します。検索パネルが開いていて検索パネル中の番号が指定された場合にはその曲のサムネイルを表示します。",
      unlist: false,
      category: "player",
      examples: "サムネイル 5",
      usage: "サムネイル [検索パネル中のインデックス]",
      argument: [{
        type: "integer",
        name: "index",
        description: "検索パネル中のインデックスを指定するとその項目のサムネイルを表示します",
        required: false
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const embed = new Helper.MessageEmbedBuilder();
    embed.setColor(getColor("THUMB"));
    if(options.rawArgs && options.data[message.guild.id].SearchPanel && Object.keys(options.data[message.guild.id].SearchPanel.Opts).includes(options.rawArgs === "" ? "n" : options.rawArgs)){
      const opt = options.data[message.guild.id].SearchPanel.Opts[Number(Util.string.NormalizeText(options.rawArgs))];
      embed
        .setImage(opt.thumbnail)
        .setTitle(opt.title)
        .setDescription("URL: " + opt.url)
      ;
    }else if(!options.rawArgs && options.data[message.guild.id].Player.isPlaying && options.data[message.guild.id].Queue.length >= 1){
      const info = options.data[message.guild.id].Queue.get(0).BasicInfo;
      embed
        .setImage(info.Thumnail)
        .setTitle(info.Title)
        .setDescription("URL: " + info.Url)
      ;
    }else{
      message.reply("✘検索結果が見つかりません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    await message.reply({
      embeds: [embed.toEris()]
    }).catch(e => Util.logger.log(e, "error"));
  }
}
