import * as discord from "discord.js";
import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { getColor } from "../Util/colorUtil";
import { log } from "../Util";

export default class EquallyPlayback extends BaseCommand {
  constructor(){
    super({
      name: "均等再生",
      alias: ["equallyplayback", "eqpb"],
      description: "追加ユーザーごとにキュー内の楽曲を均等に再生します",
      unlist: true,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(options.data[message.guild.id].EquallyPlayback){
      options.data[message.guild.id].EquallyPlayback = false;
      message.reply("❌均等再生をオフにしました").catch(e => log(e, "error"));
    }else{
      options.data[message.guild.id].EquallyPlayback = true;
      const embed = new discord.MessageEmbed()
        .setTitle("⭕均等再生をオンにしました")
        .setDescription("楽曲追加時に、楽曲を追加したユーザーごとにできるだけ均等になるようにする機能です。")
        .setColor(getColor("EQUALLY"))
      message.reply({embeds:[embed]});
    }
  }
}