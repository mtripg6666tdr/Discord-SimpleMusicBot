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
const helper_1 = require("@mtripg6666tdr/oceanic-command-resolver/helper");
const _1 = require(".");
const Util = tslib_1.__importStar(require("../Util"));
const color_1 = require("../Util/color");
let NowPlaying = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class NowPlaying extends _classSuper {
            constructor() {
                super({
                    alias: ["今の曲", "nowplaying", "np"],
                    unlist: false,
                    category: "player",
                    args: [{
                            type: "bool",
                            name: "detailed",
                            required: false,
                        }],
                    requiredPermissionsOr: [],
                    shouldDefer: false,
                });
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                const { t } = context;
                // そもそも再生状態じゃないよ...
                if (!context.server.player.isPlaying) {
                    message.reply(t("notPlaying")).catch(this.logger.error);
                    return;
                }
                // create progress bar
                const currentTimeSeconds = Math.floor(context.server.player.currentTime / 1000);
                const totalDurationSeconds = Number(context.server.player.currentAudioInfo.lengthSeconds * (context.server.audioEffects.getEnabled("nightcore") ? 5 / 6 : 1));
                const [min, sec] = Util.time.calcMinSec(currentTimeSeconds);
                const [tmin, tsec] = Util.time.calcMinSec(totalDurationSeconds);
                const info = context.server.player.currentAudioInfo;
                let progressBar = "";
                if (totalDurationSeconds > 0) {
                    const progress = Math.floor(currentTimeSeconds / totalDurationSeconds * 20);
                    progressBar += "=".repeat(progress > 0 ? progress - 1 : 0);
                    progressBar += "●";
                    progressBar += "=".repeat(20 - progress);
                }
                // create embed
                const embed = new helper_1.MessageEmbedBuilder()
                    .setColor((0, color_1.getColor)("NP"))
                    .setTitle(`${t("commands:nowplaying.nowPlayingSong")} :musical_note:`)
                    .setDescription((info.isPrivateSource
                    ? info.title
                    : `[${info.title}](${info.url})`)
                    + `\r\n${progressBar}${info.isYouTube() && info.isLiveStream
                        ? `(${t("liveStream")})`
                        : ` \`${min}:${sec}/${totalDurationSeconds === 0 ? `(${t("unknown")})` : `${tmin}:${tsec}\``}`}`);
                if (!info.isPrivateSource) {
                    embed
                        .setFields(...info.toField(["long", "l", "verbose", "l", "true"].some(arg => context.args[0] === arg)))
                        .addField(":link:URL", info.url);
                }
                if (typeof info.thumbnail === "string") {
                    embed.setThumbnail(info.thumbnail);
                    await message.reply({ embeds: [embed.toOceanic()] }).catch(this.logger.error);
                }
                else {
                    embed.setThumbnail("attachment://thumbnail." + info.thumbnail.ext);
                    await message.reply({
                        embeds: [embed.toOceanic()],
                        files: [
                            {
                                name: "thumbnail." + info.thumbnail.ext,
                                contents: info.thumbnail.data,
                            },
                        ],
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
exports.default = NowPlaying;
//# sourceMappingURL=nowplaying.js.map