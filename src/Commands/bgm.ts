import { MessageActionRow, MessageEmbed, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import * as ytpl from "ytpl";
import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class Bgm extends BaseCommand {
  constructor(){
    super({
      name: "bgm",
      alias: ["study"],
      description: "開発者が勝手に作った勉強用・作業用BGMのプリセットプレイリストを表示し、聞きたいものを選択して再生することができます。",
      unlist: false,
      category: "playlist",
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    if(!(await options.JoinVoiceChannel(message, /* reply */ false, /* reply when failed */ true))) return;
    const url = "https://www.youtube.com/playlist?list=PLLffhcApso9xIBMYq55izkFpxS3qi9hQK";
    if(options.data[message.guild.id].SearchPanel !== null){
      message.reply("✘既に開かれている検索窓があります").catch(e => Util.logger.log(e, "error"));
      return;
    }
    try{
      const reply = await message.reply("🔍確認中...");
      options.data[message.guild.id].SearchPanel = {
        Msg: {
          chId: message.channel.id,
          id: reply.id,
          userId: message.author.id,
          userName: message.member.displayName,
          commandMessage: message
        },
        Opts: {}
      };
      const {items: result} = await ytpl.default(url, {
        gl: "JP", hl: "ja"
      });
      let desc = "";
      const selectOpts = [] as MessageSelectOptionData[];
      for(let i = 0; i < result.length; i++){
        const vid = result[i];
        desc += `\`${i + 1}.\` [${vid.title}](${vid.url}) \`${vid.duration}\` - \`${vid.author.name}\` \r\n\r\n`;
        options.data[message.guild.id].SearchPanel.Opts[i + 1] = {
          title: vid.title,
          url: vid.url,
          duration: vid.duration,
          thumbnail: vid.thumbnails[0].url
        };
        selectOpts.push({
          label: `${i + 1}. ${vid.title.length > 90 ? vid.title.substring(0, 90) : vid.title}`,
          description: `長さ: ${vid.duration}, チャンネル名: ${vid.author.name}`,
          value: (i + 1).toString()
        });
      }
      const embed = new MessageEmbed()
        .setTitle("プリセットBGM一覧")
        .setDescription(desc)
        .setColor(getColor("SEARCH"))
        .setFooter({
          iconURL: message.author.avatarURL(),
          text:"動画のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
        })
      ;
      await reply.edit({
        content: null,
        embeds: [embed],
        components: [
          new MessageActionRow()
          .addComponents(
            new MessageSelectMenu()
            .setCustomId("search")
            .setPlaceholder("数字を送信するか、ここから選択...")
            .setMinValues(1)
            .setMaxValues(result.length)
            .addOptions([...selectOpts, {
              label: "キャンセル",
              value: "cancel"
            }])
          )
        ]
      });
    }
    catch(e){
      Util.logger.log(JSON.stringify(e));
      message.reply(":cry:エラーが発生しました");
    }
  }
}
