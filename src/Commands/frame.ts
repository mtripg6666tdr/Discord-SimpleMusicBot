import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { FFmpeg } from "prism-media";
import * as ytdl from "ytdl-core";

import { BaseCommand } from ".";
import { Util } from "../Util";
import { FFmpegDefaultArgs } from "../definition";

export default class Frame extends BaseCommand {
  constructor(){
    super({
      name: "フレーム",
      alias: ["frame", "キャプチャ", "capture"],
      description: "現在の再生位置の動画のフレーム画像を可能な場合取得します。引数が指定された場合その時点でのフレームを取得します",
      unlist: false,
      category: "player",
      examples: "フレーム 1:20",
      usage: "フレーム [時間]",
      argument: [{
        type: "string",
        name: "time",
        description: "指定された場合その時点でのフレームを取得します",
        required: false
      }]
    });
  }

  async run(message:CommandMessage, options:CommandArgs){
    options.updateBoundChannel(message);
    const server = options.data[message.guild.id];
    // そもそも再生状態じゃないよ...
    if(!server.Player.isConnecting || !server.Player.isPlaying){
      await message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const vinfo = server.Player.CurrentAudioInfo;
    if(!vinfo.isYouTube()){
      await message.reply(":warning:フレームのキャプチャ機能に非対応のソースです。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const time = (function(rawTime){
      if(rawTime === "" || vinfo.LiveStream) return server.Player.currentTime / 1000;
      else if(rawTime.match(/^(\d+:)*\d+(\.\d+)?$/)) return rawTime.split(":").map(n => Number(n))
        .reduce((prev, current) => prev * 60 + current);
      else return NaN;
    }(options.rawArgs));
    if(options.rawArgs !== "" && vinfo.LiveStream){
      await message.channel.createMessage("ライブストリームでは時間指定できません");
      return;
    }
    if(!vinfo.LiveStream && (isNaN(time) || time > vinfo.LengthSeconds)){
      await message.reply(":warning:時間の指定が正しくありません。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    try{
      const [hour, min, sec] = Util.time.CalcHourMinSec(Math.round(time * 100) / 100);
      const response = await message.reply(":camera_with_flash:取得中...");
      const {url, ua} = await vinfo.fetchVideo();
      const frame = await getFrame(url, time, ua);
      await response.channel.createMessage("", {
        file: frame,
        name: `capture_${ytdl.getVideoID(vinfo.Url)}-${hour}${min}${sec}.png`,
      });
      await response.edit({
        content: ":white_check_mark:完了!" + (vinfo.LiveStream ? "" : `(${hour}:${min}:${sec}時点)`),
      });
    }
    catch(e){
      Util.logger.log(Util.general.StringifyObject(e), "error");
      await message.channel.createMessage(":sob:失敗しました...").catch(er => Util.logger.log(er, "error"));
    }
  }
}

function getFrame(url:string, time:number, ua:string){
  return new Promise<Buffer>((resolve, reject) => {
    const args = [
      ...FFmpegDefaultArgs,
      "-user_agent", ua,
      "-ss", time.toString(),
      "-i", url,
      "-frames:v", "1",
      "-f", "image2pipe",
      "-vcodec", "png"
    ];
    const bufs = [] as Buffer[];
    const ffmpeg = new FFmpeg({args})
      .on("error", (er) => {
        if(!ffmpeg.destroyed) ffmpeg.destroy();
        reject(er);
      })
      .on("data", (chunks) => {
        bufs.push(chunks);
      })
      .on("end", () => {
        resolve(Buffer.concat(bufs));
        if(!ffmpeg.destroyed) ffmpeg.destroy();
      })
    ;
  });
}
