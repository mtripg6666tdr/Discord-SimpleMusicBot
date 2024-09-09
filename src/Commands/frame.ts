/*
 * Copyright 2021-2024 mtripg6666tdr
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
import type { CommandMessage } from "../Component/commandResolver/CommandMessage";

import { FFmpeg } from "prism-media";
import * as ytdl from "ytdl-core";

import { BaseCommand } from ".";
import { FFmpegDefaultNetworkArgs } from "../Component/streams/ffmpeg";
import * as Util from "../Util";
import { getLogger } from "../logger";

export default class Frame extends BaseCommand {
  constructor() {
    super({
      alias: ["frame", "キャプチャ", "capture"],
      unlist: false,
      category: "player",
      args: [{
        type: "string",
        name: "time",
        required: false,
      }],
      requiredPermissionsOr: ["admin", "sameVc"],
      shouldDefer: false,
      usage: true,
      examples: true,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs) {
    const { t } = context;

    const server = context.server;

    // そもそも再生状態ではない場合
    if (!server.player.isConnecting || !server.player.isPlaying) {
      await message.reply(t("notPlaying")).catch(this.logger.error);
      return;
    }

    const vinfo = server.player.currentAudioInfo!;
    if (!vinfo.isYouTube()) {
      await message.reply(`:warning:${t("commands:frame.unsupported")}`).catch(this.logger.error);
      return;
    } else if (vinfo.isFallbacked) {
      await message.reply(`:warning:${t("commands:frame.fallbacking")}`).catch(this.logger.error);
      return;
    }

    const time = (function(rawTime) {
      if (rawTime === "" || vinfo.isLiveStream) return server.player.currentTime / 1000;
      else if (rawTime.match(/^(\d+:)*\d+(\.\d+)?$/)) return rawTime.split(":").map(n => Number(n))
        .reduce((prev, current) => prev * 60 + current);
      else return NaN;
    }(context.rawArgs));

    if (context.rawArgs !== "" && vinfo.isLiveStream) {
      await message.channel.createMessage({
        content: t("commands:frame.liveStreamWithTime"),
      });
      return;
    }

    if (!vinfo.isLiveStream && (isNaN(time) || time > vinfo.lengthSeconds)) {
      await message.reply(`:warning: ${t("commands:frame.invalidTime")}`).catch(this.logger.error);
      return;
    }

    try {
      const [hour, min, sec] = Util.time.calcHourMinSec(time, { fixedLength: 2 });
      const response = await message.reply(`:camera_with_flash: ${t("commands:frame.capturing")}...`);
      const { url, ua } = await vinfo.fetchVideo();
      const frame = await getFrame(url, time, ua);
      await response.channel.createMessage({
        content: "",
        files: [
          {
            name: `capture_${ytdl.getVideoID(vinfo.url)}-${hour}${min}${sec}.png`,
            contents: frame,
          },
        ],
      });
      await response.edit({
        content: `:white_check_mark: ${
          t("commands:frame.finish")
        }${vinfo.isLiveStream
          ? ""
          : `(${t("commands:frame.timeAt", { hour, min, sec })})`
        }`,
      });
    }
    catch (e) {
      this.logger.error(e);
      await message.channel.createMessage({
        content: `:sob:${t("commands:frame.failed")}`,
      }).catch(this.logger.error);
    }
  }
}

function getFrame(url: string, time: number, ua: string) {
  const logger = getLogger("FFmpeg");
  return new Promise<Buffer>((resolve, reject) => {
    const args = [
      "-analyzeduration", "0",
      ...FFmpegDefaultNetworkArgs,
      "-user_agent", ua,
      "-ss", time.toString(),
      "-i", url,
      "-frames:v", "1",
      "-f", "image2pipe",
      "-vcodec", "png",
    ];
    logger.debug(`Passing args: ${args.join(" ")}`);
    const bufs = [] as Buffer[];
    const ffmpeg = new FFmpeg({ args });
    ffmpeg.process.stderr?.on("data", logger.debug);
    ffmpeg
      .on("error", (er) => {
        if (!ffmpeg.destroyed) ffmpeg.destroy(er);
        reject(er);
      })
      .on("data", (chunks) => {
        bufs.push(chunks);
      })
      .on("end", () => {
        resolve(Buffer.concat(bufs));
        if (!ffmpeg.destroyed) ffmpeg.destroy();
      })
    ;
  });
}
