import * as discord from "discord.js";
import { CommandArgs, CommandInterface, SlashCommandArgument } from ".";
import { YouTube } from "../AudioSource/youtube";
import { CommandLike } from "../Component/CommandLike";
import { getColor } from "../Util/colorUtil";
import { CalcMinSec, log } from "../Util/util";

export default class NowPlaying implements CommandInterface {
  name = "現在再生中";
  alias = ["今の曲", "np", "nowplaying"];
  description = "現在再生中の曲の情報を表示します。 `l`を引数にするとより長く概要を表示します(可能な場合)。";
  unlist = false;
  category = "player";
  argument = [{
    type: "bool",
    name: "detailed",
    description: "l、longまたはverboseが指定された場合、可能な場合より長く詳細を表示します",
    required: false
  }] as SlashCommandArgument[];
  async run(message:CommandLike, options:CommandArgs){
    options.updateBoundChannel(message);
    // そもそも再生状態じゃないよ...
    if(!options.data[message.guild.id].Manager.IsPlaying){
      message.channel.send("再生中ではありません").catch(e => log(e, "error"));
      return;
    }
    const _s = Math.floor(options.data[message.guild.id].Manager.CurrentTime / 1000);
    const _t = Number(options.data[message.guild.id].Manager.CurrentVideoInfo.LengthSeconds);
    const [min, sec] = CalcMinSec(_s);
    const [tmin,tsec] = CalcMinSec(_t);
    const info = options.data[message.guild.id].Manager.CurrentVideoInfo;
    const embed = new discord.MessageEmbed();
    embed.setColor(getColor("NP"));
    let progressBar = "";
    embed.title = "現在再生中の曲:musical_note:";
    if(_t > 0){
      const progress = Math.floor(_s / _t * 20);
      for(let i = 1 ; i < progress; i++){
        progressBar += "=";
      }
      progressBar += "●";
      for(let i = progress + 1; i <= 20; i++){
        progressBar += "=";
      }
    }
    embed.description = "[" + info.Title + "](" + info.Url + ")\r\n" + progressBar + ((info.ServiceIdentifer === "youtube" && (info as YouTube).LiveStream) ? "(ライブストリーム)" : " `" + min + ":" + sec + "/" + (_t === 0 ? "(不明)" : tmin + ":" + tsec + "`"));
    embed.setThumbnail(info.Thumnail);
    embed.fields = info.toField(
      (options.args[0] === "long" || options.args[0] === "l" || options.args[0] === "verbose") ? true : false
    );
    embed.addField(":link:URL", info.Url);

    message.channel.send({embeds:[embed]}).catch(e => log(e, "error"));
  }
}