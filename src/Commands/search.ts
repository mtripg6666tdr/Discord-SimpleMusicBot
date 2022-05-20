import * as discord from "discord.js";
import * as ytsr from "ytsr";
import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { getColor } from "../Util/color";
import { Util } from "../Util";
import { searchYouTube } from "../AudioSource";

export default class Search extends BaseCommand {
  constructor(){
    super({
      name: "検索",
      alias: ["search", "se"],
      description: "曲をYouTubeで検索します。直接URLを直接指定することもできます。",
      unlist: false,
      category: "playlist",
      examples: "検索 夜に駆ける",
      usage: "検索 <キーワード>",
      argument: [{
        type: "string",
        name: "keyword",
        description: "検索したい動画のキーワードまたはURL。",
        required: true
      }],
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    options.JoinVoiceChannel(message);
    if(options.rawArgs.startsWith("http://") || options.rawArgs.startsWith("https://")){
      options.args.forEach(async u => {
        await options.PlayFromURL(message, u, !options.data[message.guild.id].Player.IsConnecting);
      });
      return;
    }
    const s = Util.time.timer.start("Search(Command)->BeforeYtsr");
    if(options.data[message.guild.id].SearchPanel !== null){
      message.reply("✘既に開かれている検索窓があります").catch(e => Util.logger.log(e, "error"));
      return;
    }
    if(options.rawArgs !== ""){
      options.data[message.guild.id].SearchPanel = {} as any;
      const msg = await message.reply("🔍検索中...");
      options.data[message.guild.id].SearchPanel = {
        Msg: {
          id: msg.id,
          chId: msg.channel.id,
          userId: message.author.id,
          userName: message.member.displayName,
          commandMessage: message
        },
        Opts: {}
      };
      s.end();
      try{
        const t = Util.time.timer.start("Search(Command)->Ytsr");
        const result = await searchYouTube(options.rawArgs);
        t.end();
        const u = Util.time.timer.start("Search(Command)->AfterYtsr");
        const embed = new discord.MessageEmbed();
        embed.setTitle("\"" + options.rawArgs + "\"の検索結果✨");
        embed.setColor(getColor("SEARCH"));
        let desc = "";
        let index = 1;
        const selectOpts = [] as discord.MessageSelectOptionData[];
        for(let i = 0; i < result.items.length; i++){
          if(result.items[i].type == "video"){
            const video = (result.items[i] as ytsr.Video);
            desc += `\`${index}.\` [${video.title}](${video.url}) \`${video.duration}\` - \`${video.author.name}\` \r\n\r\n`;
            options.data[message.guild.id].SearchPanel.Opts[index] = {
              url: video.url,
              title: video.title,
              duration: video.duration,
              thumbnail: video.bestThumbnail.url
            };
            selectOpts.push({
              label: index + ". " + (video.title.length > 90 ? video.title.substring(0, 90) + "…" : video.title),
              description: `長さ: ${video.duration}, チャンネル名: ${video.author.name}`,
              value: index.toString()
            });
            index++;
          }
        }
        if(index === 1){
          options.data[message.guild.id].SearchPanel = null;
          await msg.edit(":pensive:見つかりませんでした。");
          return;
        }
        embed
          .setDescription(desc)
          .setFooter({
            iconURL: message.author.avatarURL(),
            text:"動画のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
          })
        ;
        await msg.edit({
          content: null, 
          embeds:[embed],
          components: [
            new discord.MessageActionRow()
            .addComponents(
              new discord.MessageSelectMenu()
              .setCustomId("search")
              .setPlaceholder("数字を送信するか、ここから選択...")
              .setMinValues(1)
              .setMaxValues(index - 1)
              .addOptions([...selectOpts, {
                label: "キャンセル",
                value: "cancel"
              }])
            )
          ]
        });
        u.end();
      }
      catch(e){
        Util.logger.log(e, "error");
        options.data[message.guild.id].SearchPanel = null;
        if(msg) msg.edit("✘内部エラーが発生しました").catch(e => Util.logger.log(e, "error"));
        else message.reply("✘内部エラーが発生しました").catch(e => Util.logger.log(e, "error"));
      }
    }else{
      message.reply("引数を指定してください").catch(e => Util.logger.log(e, "error"));
    }
  }
}