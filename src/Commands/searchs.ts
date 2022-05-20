import * as discord from "discord.js";
import Soundcloud, { SoundcloudTrackV2 } from "soundcloud.ts";
import { CommandArgs, BaseCommand } from ".";
import { SoundCloudTrackCollection } from "../AudioSource";
import { CommandMessage } from "../Component/CommandMessage";
import { DefaultUserAgent } from "../definition";
import { getColor } from "../Util/colorUtil";
import { CalcMinSec, DownloadText, log } from "../Util";

export default class Searchs extends BaseCommand {
  constructor(){
    super({
      name: "サウンドクラウドを検索",
      alias: ["soundcloudを検索", "searchs", "ses", "ss"],
      description: "曲をSoundCloudで検索します",
      unlist: false,
      category: "playlist",
      examples: "ses sakura trip",
      usage: "ses <キーワード>",
      argument: [{
        type: "string",
        name: "keyword",
        description: "検索したい楽曲のキーワードまたはURL。",
        required: true
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    options.JoinVoiceChannel(message);
    if(options.data[message.guild.id].SearchPanel !== null){
      message.reply("✘既に開かれている検索窓があります").catch(e => log(e, "error"));
      return;
    }
    if(options.rawArgs !== ""){
      let msg = null as discord.Message;
      let desc = "";
      try{
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
        const soundcloud = new Soundcloud();
        let result:SoundcloudTrackV2[] = [];
        if(options.rawArgs.match(/^https:\/\/soundcloud.com\/[^\/]+$/)){
          // ユーザーの楽曲検索
          const user = (await soundcloud.users.getV2(options.rawArgs));
          options.rawArgs = user.username
          let nextUrl = "";
          let rawResult = (await soundcloud.api.getV2("users/" + user.id+ "/tracks") as SoundCloudTrackCollection);
          result.push(...rawResult.collection);
          nextUrl = rawResult.next_href + "&client_id=" + await soundcloud.api.getClientID();
          while(nextUrl && result.length < 10){
            const data = await DownloadText(nextUrl, {
              "User-Agent": DefaultUserAgent
            });
            rawResult = JSON.parse(data) as SoundCloudTrackCollection
            result.push(...rawResult.collection);
            nextUrl = rawResult.next_href ? rawResult.next_href + "&client_id=" + await soundcloud.api.getClientID() : rawResult.next_href;
          }
        }else{
          // 楽曲検索
          result = (await soundcloud.tracks.searchV2({q: options.rawArgs})).collection;
        }
        if(result.length > 12) result = result.splice(0, 11);
        const embed = new discord.MessageEmbed();
        embed.setColor(getColor("SEARCH"));
        embed.title = "\"" + options.rawArgs + "\"の検索結果✨"
        let index = 1;
        let selectOpts = [] as discord.MessageSelectOptionData[];
        for(let i = 0; i < result.length; i++){
          const [min,sec] = CalcMinSec(Math.floor(result[i].duration / 1000));
          desc += "`" + index + ".` [" + result[i].title + "](" + result[i].permalink_url + ") " + min + ":" + sec + " - [" + result[i].user.username + "](" + result[i].user.permalink_url + ") \r\n\r\n";
          options.data[message.guild.id].SearchPanel.Opts[index] = {
            url: result[i].permalink_url,
            title: result[i].title,
            duration: result[i].full_duration.toString(),
            thumbnail: result[i].artwork_url
          };
          selectOpts.push({
            label: index + ". " + (result[i].title.length > 90 ? result[i].title.substr(0, 90) + "…" : result[i].title),
            description: "長さ: " + min + ":" + sec + ", ユーザー: " + result[i].user.username,
            value: index.toString()
          });
          index++;
        }
        if(index === 1){
          options.data[message.guild.id].SearchPanel = null;
          await msg.edit(":pensive:見つかりませんでした。");
          return;
        }
        embed.description = desc;
        embed.footer = {
          iconURL: message.author.avatarURL(),
          text:"楽曲のタイトルを選択して数字を送信してください。キャンセルするにはキャンセルまたはcancelと入力します。"
        };
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
      }
      catch(e){
        log(e, "error");
        options.data[message.guild.id].SearchPanel = null;
        if(msg) msg.edit("✘内部エラーが発生しました").catch(e => log(e, "error"));
        else message.reply("✘内部エラーが発生しました").catch(e => log(e, "error"));
      }
    }else{
      message.reply("引数を指定してください").catch(e => log(e, "error"));
    }
  }
}