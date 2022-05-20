import { MessageActionRow, MessageEmbed, MessageSelectMenu, MessageSelectOptionData } from "discord.js";
import * as ytpl from "ytpl";
import { CommandArgs, BaseCommand } from ".";
import { CommandMessage } from "../Component/CommandMessage"
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class News extends BaseCommand {
  constructor(){
    super({
      name: "ニュース",
      alias: ["news"],
      description: "現在配信されているニューストピックスを閲覧・視聴できます。",
      unlist: false,
      category: "playlist",
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    await options.JoinVoiceChannel(message);
    const url = "https://www.youtube.com/playlist?list=PL3ZQ5CpNulQk8-p0CWo9ufI81IdrGoyNZ";
    if(options.data[message.guild.id].SearchPanel !== null){
      message.reply("✘既に開かれている検索窓があります").catch(e => Util.logger.log(e, "error"));
      return;
    }
    try{
      const reply = await message.reply("🔍取得中...");
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
        gl: "JP", hl: "ja", limit: 20
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
        .setTitle("ニューストピックス")
        .setDescription(desc)
        .setColor(getColor("SEARCH"))
        .setFooter({
          iconURL: message.author.avatarURL(),
          text:"ニュースのタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
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
