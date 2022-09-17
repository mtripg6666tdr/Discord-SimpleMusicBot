/*
 * Copyright 2021-2022 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/CommandMessage";

import { FFmpeg } from "prism-media";
import * as ytdl from "ytdl-core";

import { BaseCommand } from ".";
import { ytdlCore } from "../AudioSource/youtube/strategies/ytdl-core";
import { Util } from "../Util";
import { FFmpegDefaultNetworkArgs } from "../definition";

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
    options.server.updateBoundChannel(message);
    const server = options.server;
    // そもそも再生状態じゃないよ...
    if(!server.player.isConnecting || !server.player.isPlaying){
      await message.reply("再生中ではありません").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const vinfo = server.player.currentAudioInfo;
    if(!vinfo.isYouTube()){
      await message.reply(":warning:フレームのキャプチャ機能に非対応のソースです。").catch(e => Util.logger.log(e, "error"));
      return;
    }else if(vinfo["cache"] && vinfo["cache"].type !== ytdlCore){
      await message.reply(":warning:フォールバックしているため、現在この機能を使用できません。").catch(e => Util.logger.log(e, "error"));
      return;
    }
    const time = (function(rawTime){
      if(rawTime === "" || vinfo.LiveStream) return server.player.currentTime / 1000;
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
      const { url, ua } = await vinfo.fetchVideo();
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
      Util.logger.log(e, "error");
      await message.channel.createMessage(":sob:失敗しました...").catch(er => Util.logger.log(er, "error"));
    }
  }
}

function getFrame(url:string, time:number, ua:string){
  return new Promise<Buffer>((resolve, reject) => {
    const args = [
      "-analyzeduration", "0",
      ...FFmpegDefaultNetworkArgs,
      "-user_agent", ua,
      "-ss", time.toString(),
      "-i", url,
      "-frames:v", "1",
      "-f", "image2pipe",
      "-vcodec", "png"
    ];
    Util.logger.log(`[FFmpeg] Passing args: ${args.join(" ")}`, "debug");
    const bufs = [] as Buffer[];
    const ffmpeg = new FFmpeg({args});
    if(Util.config.debug) ffmpeg.process.stderr.on("data", chunk => Util.logger.log(`[FFmpeg] ${chunk.toString()}`, "debug"));
    ffmpeg
      .on("error", (er) => {
        if(!ffmpeg.destroyed) ffmpeg.destroy(er);
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
