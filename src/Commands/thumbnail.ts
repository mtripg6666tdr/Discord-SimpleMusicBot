import * as discord from "discord.js";
import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { getColor } from "../Util/color";
import { Util } from "../Util";

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
    const embed = new discord.MessageEmbed();
    embed.setColor(getColor("THUMB"));
    if(options.rawArgs && options.data[message.guild.id].SearchPanel && Object.keys(options.data[message.guild.id].SearchPanel.Opts).indexOf(options.rawArgs === "" ? "n" : options.rawArgs) >= 0){
      const opt = options.data[message.guild.id].SearchPanel.Opts[Number(Util.string.NormalizeText(options.rawArgs))];
      embed.setImage(opt.thumbnail);
      embed.title = opt.title;
      embed.description = "URL: " + opt.url;
    }else if(!options.rawArgs && options.data[message.guild.id].Player.IsPlaying && options.data[message.guild.id].Queue.length >= 1){
      const info = options.data[message.guild.id].Queue.get(0).BasicInfo;
      embed.setImage(info.Thumnail);
      embed.title = info.Title;
      embed.description = "URL: " + info.Url;
    }else{
      message.reply("✘検索結果が見つかりません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    message.reply({embeds:[embed]}).catch(e => Util.logger.log(e, "error"));
  }
}
