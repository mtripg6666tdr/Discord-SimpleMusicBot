import * as discord from "discord.js";
import * as ytsr from "ytsr";
import { CommandArgs, CommandInterface, SlashCommandArgument } from ".";
import { getColor } from "../Util/colorUtil";
import { log } from "../Util/util";

export default class Search implements CommandInterface {
  name = "検索";
  alias = ["search", "se"];
  description = "曲をYouTubeで検索します。直接URLを直接指定することもできます。";
  unlist = false;
  category = "playlist";
  examples = "検索 夜に駆ける";
  usage = "検索 <キーワード>";
  argument = [{
    type: "string",
    name: "keyword",
    description: "検索したい動画のキーワードまたはURL。",
    required: true
  }] as SlashCommandArgument[];
  async run(message:discord.Message, options:CommandArgs){
    options.updateBoundChannel(message);
    options.Join(message);
    if(options.rawArgs.startsWith("http://") || options.rawArgs.startsWith("https://")){
      options.args.forEach(async u => {
        await options.PlayFromURL(message, u, !options.data[message.guild.id].Manager.IsConnecting);
      });
      return;
    }
    if(options.data[message.guild.id].SearchPanel !== null){
      message.channel.send("✘既に開かれている検索窓があります").catch(e => log(e, "error"));
      return;
    }
    if(options.rawArgs !== ""){
      options.data[message.guild.id].SearchPanel = {} as any;
      const msg = await message.channel.send("🔍検索中...");
      options.data[message.guild.id].SearchPanel = {
        Msg: {
          id: msg.id,
          chId: msg.channel.id,
          userId: message.author.id,
          userName: message.member.displayName
        },
        Opts: {}
      };
      try{
        const result = await ytsr.default(options.rawArgs, {
          limit:12,
          gl: "JP",
          hl: "ja"
        });
        const embed = new discord.MessageEmbed();
        embed.title = "\"" + options.rawArgs + "\"の検索結果✨";
        embed.setColor(getColor("SEARCH"));
        let desc = "";
        let index = 1;
        for(let i = 0; i < result.items.length; i++){
          if(result.items[i].type == "video"){
            const video = (result.items[i] as ytsr.Video);
            desc += "`" + index + ".` [" + video.title + "](" + video.url + ") `" + video.duration + "` - `" + video.author.name + "` \r\n\r\n";
            options.data[message.guild.id].SearchPanel.Opts[index] = {
              url: video.url,
              title: video.title,
              duration: video.duration,
              thumbnail: video.bestThumbnail.url
            };
            index++;
          }
        }
        if(index === 1){
          options.data[message.guild.id].SearchPanel = null;
          await msg.edit(":pensive:見つかりませんでした。");
          return;
        }
        embed.description = desc;
        embed.footer = {
          iconURL: message.author.avatarURL(),
          text:"動画のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
        };
        await msg.edit({content: null, embeds:[embed]});
      }
      catch(e){
        log(e, "error");
        message.channel.send("✘内部エラーが発生しました").catch(e => log(e, "error"));
      }
    }else{
      message.channel.send("引数を指定してください").catch(e => log(e, "error"));
    }
  }
}