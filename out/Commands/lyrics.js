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
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const Genius = tslib_1.__importStar(require("genius-lyrics"));
const html_entities_1 = require("html-entities");
const html_to_text_1 = require("html-to-text");
const _1 = require(".");
const Util_1 = require("../Util");
const definition_1 = require("../definition");
let Lyrics = (() => {
    var _a;
    var _b;
    let _classSuper = _1.BaseCommand;
    let _instanceExtraInitializers = [];
    let _run_decorators;
    return _a = class Lyrics extends _classSuper {
            constructor() {
                super({
                    alias: ["lyrics", "l", "lyric"],
                    unlist: false,
                    category: "utility",
                    args: [
                        {
                            type: "string",
                            name: "keyword",
                            required: true,
                        },
                    ],
                    requiredPermissionsOr: [],
                    shouldDefer: false,
                    usage: true,
                    examples: true,
                });
                tslib_1.__runInitializers(this, _instanceExtraInitializers);
            }
            async run(message, context) {
                const { t } = context;
                const msg = await message.reply("🔍検索中...");
                try {
                    const songInfo = await getLyrics.call(this, context.rawArgs);
                    const embeds = [];
                    if (!songInfo.lyric)
                        throw new Error("取得した歌詞が空でした");
                    const chunkLength = Math.ceil(songInfo.lyric.length / 4000);
                    for (let i = 0; i < chunkLength; i++) {
                        const partial = songInfo.lyric.substring(4000 * i, 4000 * (i + 1) - 1);
                        embeds.push(new helper_1.MessageEmbedBuilder()
                            .setDescription(partial)
                            .setColor(Util_1.color.getColor("LYRIC")));
                    }
                    embeds[0]
                        .setTitle(t("commands:lyrics.embedTitle", { title: songInfo.title, artist: songInfo.artist }))
                        .setURL(songInfo.url)
                        .setThumbnail(songInfo.artwork);
                    embeds[embeds.length - 1]
                        .setFooter({
                        text: message.member.displayName,
                        iconURL: message.member.avatarURL(),
                    });
                    msg.edit({
                        content: "",
                        embeds: embeds.map(embed => embed.toOceanic()),
                    }).catch(this.logger.error);
                }
                catch (e) {
                    this.logger.error(e);
                    await msg.edit(`:confounded:${t("commands:lyrics.failed")}`)
                        .catch(this.logger.error);
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
exports.default = Lyrics;
async function getLyrics(keyword) {
    try {
        const client = new Genius.Client();
        const song = (await client.songs.search(keyword))[0];
        return {
            artist: song.artist.name,
            artwork: song.image,
            lyric: await song.lyrics(),
            title: song.title,
            url: song.url,
        };
    }
    catch (e) {
        // Fallback to utaten
        if (!process.env.CSE_KEY)
            throw e;
        this.logger.warn(e);
        const { body } = await candyget_1.default.json(`${Buffer.from("aHR0cHM6Ly9jdXN0b21zZWFyY2guZ29vZ2xlYXBpcy5jb20vY3VzdG9tc2VhcmNoL3YxP2N4PTg5ZWJjY2FjZGMzMjQ2MWYy", "base64").toString()}&key=${process.env.CSE_KEY}&q=${encodeURIComponent(keyword)}`);
        const data = body;
        const items = data.items?.filter(i => new URL(i.link).pathname.startsWith("/lyric/"));
        if (!items || items.length === 0) {
            throw new Error("No lyric was found");
        }
        const url = items[0].link;
        let { body: lyric } = await candyget_1.default.string(url, {
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "Cookie": "lyric_ruby=off;",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.77 Safari/537.36",
            },
        });
        let doc = "";
        [doc, lyric] = lyric.split("<div class=\"hiragana\" >");
        lyric = lyric.split("</div>")[0]
            .replace(/<span class="rt rt_hidden">.+?<\/span>/g, "")
            .replace(/\n/g, "")
            .replace(/<br \/>/g, "<br>")
            .replace(/[\r\n]{2}/g, "<br>");
        lyric = (0, html_to_text_1.convert)(lyric);
        const structuredData = JSON.parse(doc.match(/<script\stype="application\/ld\+json">(\r?\n?)\s*(?<json>.+)<\/script>/).groups.json);
        const artwork = doc.match(/<img src="(?<url>.+?)" alt=".+? 歌詞" \/>/)?.groups?.url;
        return {
            lyric: (0, html_entities_1.decode)(lyric),
            artist: structuredData.recordedAs.byArtist.name,
            title: structuredData.name,
            artwork: artwork?.startsWith("http") ? artwork : definition_1.DefaultAudioThumbnailURL,
            url: url,
        };
    }
}
//# sourceMappingURL=lyrics.js.map