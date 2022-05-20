import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { Util } from "../Util";

export default class Rmall extends BaseCommand {
  constructor(){
    super({
      name: "すべて削除",
      alias: ["すべて削除", "rmall", "allrm", "removeall"],
      description: "キュー内の曲をすべて削除します。\r\n※接続中の場合ボイスチャンネルから離脱します。",
      unlist: false,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!message.member.voice.channel || (message.member.voice.channel && !message.member.voice.channel.members.has(options.client.user.id))){
      if(!message.member.permissions.has("MANAGE_GUILD") && !message.member.permissions.has("MANAGE_CHANNELS")){
        message.reply("この操作を実行する権限がありません。").catch(e => Util.logger.log(e, "error"));
        return;
      }
    }
    options.data[message.guild.id].Player.Disconnect();
    options.data[message.guild.id].Queue.RemoveAll();
    message.reply("✅すべて削除しました").catch(e => Util.logger.log(e, "error"))
  }
}