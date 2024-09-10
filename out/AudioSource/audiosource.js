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
exports.AudioSource = void 0;
const definition_1 = require("../definition");
const logger_1 = require("../logger");
// declare alias and substitute later to prevent recursive import.
// eslint-disable-next-line @typescript-eslint/init-declarations, prefer-const
let YouTubeAlias;
/**
 * 音楽ボットで解釈できるオーディオファイルのソースを表します。
 * @template T サムネイルの種類
 */
class AudioSource {
    get url() {
        return this._url;
    }
    set url(value) {
        this._url = value;
    }
    get title() {
        return this._title;
    }
    set title(value) {
        this._title = value;
    }
    get lengthSeconds() {
        return this._lengthSeconds;
    }
    set lengthSeconds(value) {
        this._lengthSeconds = value;
    }
    get description() {
        return this._description;
    }
    set description(value) {
        this._description = value;
    }
    get thumbnail() {
        return this._thumbnail || definition_1.DefaultAudioThumbnailURL;
    }
    set thumbnail(value) {
        this._thumbnail = value;
    }
    get isPrivateSource() {
        return this._isPrivateSource;
    }
    set isPrivateSource(value) {
        this._isPrivateSource = value;
    }
    get isCachable() {
        return this._isCacheable;
    }
    get isSeekable() {
        return this._isSeekable;
    }
    constructor(options = {}) {
        // 曲の長さ
        this._lengthSeconds = 0;
        // 非公開ソースかどうかを表すフラグ
        this._isPrivateSource = false;
        options = Object.assign({ isSeekable: true, isCacheable: true }, options);
        this.logger = (0, logger_1.getLogger)(this.constructor.name);
        this._isSeekable = options.isSeekable;
        this._isCacheable = options.isCacheable;
    }
    /**
     * 内部情報のキャッシュに対応しているソースに対して、キャッシュデータの削除を実行します。
     * それ以外のソースではこの関数は何もしません。
     */
    purgeCache() { }
    /** オーディオソースがYouTubeであるかを返します。それ以外のソースに対してはinstanceofを使用してください。 */
    isYouTube() {
        return this instanceof YouTubeAlias;
    }
    /** プライベートなソースとして設定します */
    markAsPrivateSource() {
        this.isPrivateSource = true;
    }
}
exports.AudioSource = AudioSource;
YouTubeAlias = require("./youtube").YouTube;
//# sourceMappingURL=audiosource.js.map