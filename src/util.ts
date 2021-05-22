import { Client, MessageEmbed, TextChannel } from "discord.js";
import { GuildVoiceInfo, VideoInfo } from "./definition";

export async function AddQueue(client:Client, data:GuildVoiceInfo, video:VideoInfo){
  data.Queue.AddQueue(video.url);
  const embed = new MessageEmbed();
  embed.title = "✅曲が追加されました";
  embed.description = "[" + video.title + "](" + video.url + ") `" + video.duration + "`";
  try{
    const ch = await client.channels.fetch(data.SearchPanel.Msg.chId) as TextChannel;
    const msg = await (ch as TextChannel).messages.fetch(data.SearchPanel.Msg.id);
    await msg.edit("", embed);
  }
  catch(e){
    console.error(e);
  }
}