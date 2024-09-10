"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const prism_media_1 = require("prism-media");
const ytdl = tslib_1.__importStar(require("ytdl-core"));
const _1 = require(".");
const ffmpeg_1 = require("../Component/streams/ffmpeg");
const Util = tslib_1.__importStar(require("../Util"));
const logger_1 = require("../logger");
let Frame = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class Frame extends _classSuper {
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
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                const { t } = context;
                const server = context.server;
                // そもそも再生状態ではない場合
                if (!server.player.isConnecting || !server.player.isPlaying) {
                    await message.reply(t("notPlaying")).catch(this.logger.error);
                    return;
                }
                const vinfo = server.player.currentAudioInfo;
                if (!vinfo.isYouTube()) {
                    await message.reply(`:warning:${t("commands:frame.unsupported")}`).catch(this.logger.error);
                    return;
                }
                else if (vinfo.isFallbacked) {
                    await message.reply(`:warning:${t("commands:frame.fallbacking")}`).catch(this.logger.error);
                    return;
                }
                const time = (function (rawTime) {
                    if (rawTime === "" || vinfo.isLiveStream)
                        return server.player.currentTime / 1000;
                    else if (rawTime.match(/^(\d+:)*\d+(\.\d+)?$/))
                        return rawTime.split(":").map(n => Number(n))
                            .reduce((prev, current) => prev * 60 + current);
                    else
                        return NaN;
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
                        content: `:white_check_mark: ${t("commands:frame.finish")}${vinfo.isLiveStream
                            ? ""
                            : `(${t("commands:frame.timeAt", { hour, min, sec })})`}`,
                    });
                }
                catch (e) {
                    this.logger.error(e);
                    await message.channel.createMessage({
                        content: `:sob:${t("commands:frame.failed")}`,
                    }).catch(this.logger.error);
                }
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _run_decorators = [(_b = _1.BaseCommand).updateBoundChannel.bind(_b)];
            tslib_1.__esDecorate(_a, null, _run_decorators, { kind: "method", name: "run", static: false, private: false, access: { has: obj => "run" in obj, get: obj => obj.run }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.default = Frame;
function getFrame(url, time, ua) {
    const logger = (0, logger_1.getLogger)("FFmpeg");
    return new Promise((resolve, reject) => {
        const args = [
            "-analyzeduration", "0",
            ...ffmpeg_1.FFmpegDefaultNetworkArgs,
            "-user_agent", ua,
            "-ss", time.toString(),
            "-i", url,
            "-frames:v", "1",
            "-f", "image2pipe",
            "-vcodec", "png",
        ];
        logger.debug(`Passing args: ${args.join(" ")}`);
        const bufs = [];
        const ffmpeg = new prism_media_1.FFmpeg({ args });
        ffmpeg.process.stderr?.on("data", logger.debug);
        ffmpeg
            .on("error", (er) => {
            if (!ffmpeg.destroyed)
                ffmpeg.destroy(er);
            reject(er);
        })
            .on("data", (chunks) => {
            bufs.push(chunks);
        })
            .on("end", () => {
            resolve(Buffer.concat(bufs));
            if (!ffmpeg.destroyed)
                ffmpeg.destroy();
        });
    });
}
//# sourceMappingURL=frame.js.map