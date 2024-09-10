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
exports.Playlist = Playlist;
const tslib_1 = require("tslib");
const ytpl_1 = tslib_1.__importDefault(require("ytpl"));
const Util_1 = require("../../Util");
const config_1 = require("../../config");
const dYtpl = (0, Util_1.requireIfAny)("@distube/ytpl");
const config = (0, config_1.getConfig)();
const playlistSearchOptions = {
    gl: config.country,
    hl: config.defaultLanguage,
};
// eslint-disable-next-line @typescript-eslint/ban-types
function Playlist(id, options = {}) {
    if (dYtpl) {
        return dYtpl(id, { ...playlistSearchOptions, ...options })
            .then(resolveDYtplToResult)
            .catch(() => {
            return (0, ytpl_1.default)(id, { ...playlistSearchOptions, ...options }).then(resolveYtplToResult);
        });
    }
    return (0, ytpl_1.default)(id, { ...playlistSearchOptions, ...options }).then(resolveYtplToResult);
}
Playlist.validateID = function validateID(url) {
    return ytpl_1.default.validateID(url);
};
Playlist.getPlaylistID = function getPlaylistID(url) {
    return ytpl_1.default.getPlaylistID(url);
};
function resolveYtplToResult(result) {
    return {
        title: result.title,
        itemCount: result.estimatedItemCount,
        visibility: result.visibility === "everyone" ? "public" : result.visibility,
        url: result.url,
        thumbnailUrl: result.bestThumbnail.url,
        items: result.items.map(item => ({
            url: item.url,
            title: item.title,
            author: item.author.name,
            isLive: item.isLive,
            duration: item.durationSec || 0,
            durationText: item.duration || "0",
            thumbnail: item.thumbnails[0]?.url || null,
        })),
    };
}
function resolveDYtplToResult(result) {
    let thumbnailUrl = null;
    if ("thumbnail" in result) {
        const thumbnail = result.thumbnail;
        if (typeof thumbnail?.url === "string") {
            thumbnailUrl = thumbnail.url;
        }
    }
    return {
        title: result.title,
        // @ts-expect-error @distube/ytpl is missing 'estimatedItemCount' typing
        itemCount: result.total_items || result.estimatedItemCount,
        visibility: result.visibility === "everyone" ? "public" : "unlisted",
        url: result.url,
        thumbnailUrl,
        items: result.items.map(item => ({
            url: item.url,
            title: item.title,
            author: item.author?.name || "unknown",
            // @ts-expect-error @distube/ytpl is missing 'isLive' typing
            isLive: item.isLive,
            duration: item.duration
                ?.split(":")
                .reduce((p, c) => p * 60 + Number(c), 0) || 0,
            durationText: item.duration || "0",
            thumbnail: item.thumbnail,
        })),
    };
}
//# sourceMappingURL=playlist.js.map