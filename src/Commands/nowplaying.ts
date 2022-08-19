import type { CommandArgs } from ".";
import type { YouTube } from "../AudioSource";
import type { CommandMessage } from "../Component/CommandMessage";

import * as discord from "discord.js";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { getColor } from "../Util/color";

export default class NowPlaying extends BaseCommand {
  constructor(){
    super({
      name: "現在再生中",
      alias: ["今の曲", "np", "nowplaying"],
      description: "現在再生中の曲の情報を表示します。 `l`を引数にするとより長く概要を表示します(可能な場合)。",
      unlist: false,
      category: "player",
      argument: [{
        type: "bool",
        name: "detailed",
        description: "Trueが指定された場合、可能な場合より長く詳細を表示します",
        required: false
      }]
    });
  }
  
  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    // そもそも再生状態じゃないよ...
    if(!options.data[message.guild.id].Player.IsPlaying){
      message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const _s = Math.floor(options.data[message.guild.id].Player.CurrentTime / 1000);
    const _t = Number(options.data[message.guild.id].Player.CurrentAudioInfo.LengthSeconds);
    const [min, sec] = Util.time.CalcMinSec(_s);
    const [tmin, tsec] = Util.time.CalcMinSec(_t);
    const info = options.data[message.guild.id].Player.CurrentAudioInfo;
    const embed = new discord.MessageEmbed();
    embed.setColor(getColor("NP"));
    let progressBar = "";
    embed.title = "現在再生中の曲:musical_note:";
    if(_t > 0){
      const progress = Math.floor(_s / _t * 20);
      for(let i = 1; i < progress; i++){
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
      !!((options.args[0] === "long" || options.args[0] === "l" || options.args[0] === "verbose" || options.args[0] === "true"))
    );
    embed.addField(":link:URL", info.Url);

    message.reply({embeds: [embed]}).catch(e => Util.logger.log(e, "error"));
  }
}
