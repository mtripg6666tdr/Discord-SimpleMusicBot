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
const candyget_1 = tslib_1.__importDefault(require("candyget"));
const _1 = require(".");
const search_1 = require("./search");
const Util_1 = require("../Util");
const config_1 = require("../config");
const config = (0, config_1.getConfig)();
class SearchN extends search_1.SearchBase {
    constructor() {
        super({
            alias: ["ニコニコを検索", "ニコ動を検索", "searchnico", "searchniconico", "searchn"],
            unlist: false,
            category: "playlist",
            args: [
                {
                    type: "string",
                    name: "keyword",
                    required: true,
                },
            ],
            requiredPermissionsOr: ["admin", "noConnection", "sameVc"],
            shouldDefer: true,
            disabled: config.isDisabledSource("niconico"),
            usage: true,
            examples: true,
        });
    }
    searchContent(query) {
        return searchNicoNico(query);
    }
    consumer(result) {
        const { t } = (0, _1.getCommandExecutionContext)();
        return result.map(item => {
            const [min, sec] = Util_1.time.calcMinSec(Math.floor(item.lengthSeconds));
            return {
                url: `https://www.nicovideo.jp/watch/${item.contentId}`,
                title: item.title,
                duration: `${min}:${sec}`,
                thumbnail: item.thumbnailUrl,
                author: `${t("audioSources.playCountLabel")} ${t("audioSources.playCount", { count: item.viewCounter })}`,
                description: `${t("length")}: ${min}:${sec}`,
            };
        });
    }
}
exports.default = SearchN;
const API_ENDPOINT = "https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search";
async function searchNicoNico(keyword) {
    const url = `${API_ENDPOINT}?q=${encodeURIComponent(keyword)}&targets=title,description,tags&fields=contentId,title,lengthSeconds,thumbnailUrl,viewCounter&_sort=-viewCounter`;
    const result = await candyget_1.default.json(url, {
        validator(responseBody) {
            return responseBody.data && Array.isArray(responseBody.data) && responseBody.meta.status === 200;
        },
    });
    return result.body.data;
}
//# sourceMappingURL=searchnico.js.map