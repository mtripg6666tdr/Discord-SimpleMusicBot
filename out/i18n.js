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
exports.discordLanguages = void 0;
exports.initLocalization = initLocalization;
exports.availableLanguages = availableLanguages;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const i18next_1 = tslib_1.__importDefault(require("i18next"));
const i18next_fs_backend_1 = tslib_1.__importDefault(require("i18next-fs-backend"));
// Ref: https://stackoverflow.com/questions/60131681/make-sure-array-has-all-types-from-a-union
const arrayOfAll = () => (array) => array;
exports.discordLanguages = arrayOfAll()([
    "id",
    "da",
    "de",
    "en-GB",
    "en-US",
    "es-ES",
    "es-419",
    "fr",
    "hr",
    "it",
    "lt",
    "hu",
    "nl",
    "no",
    "pl",
    "pt-BR",
    "ro",
    "fi",
    "sv-SE",
    "vi",
    "tr",
    "cs",
    "el",
    "bg",
    "ru",
    "uk",
    "hi",
    "th",
    "zh-CN",
    "ja",
    "zh-TW",
    "ko",
]);
const localesRoot = path_1.default.join(__dirname, "../locales/");
const lngsInLocalesDirectory = fs_1.default.readdirSync(localesRoot, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .flatMap(d => d.name);
const supportedDiscordLocales = exports.discordLanguages.filter(lang => {
    if (lang.includes("-")) {
        return lngsInLocalesDirectory.includes(lang);
    }
    else {
        return lngsInLocalesDirectory.some(directoryLang => directoryLang.split("-")[0] === lang);
    }
});
function initLocalization(debug, lang) {
    return i18next_1.default
        .use(i18next_fs_backend_1.default)
        .init({
        debug,
        cleanCode: true,
        load: "all",
        supportedLngs: lngsInLocalesDirectory.flatMap(dirLang => dirLang.includes("-") ? [dirLang.split("-")[0], dirLang] : [dirLang]),
        preload: lngsInLocalesDirectory,
        fallbackLng: originalLanguage => {
            if (typeof originalLanguage === "string") {
                return [...lngsInLocalesDirectory.filter(dirLang => dirLang.includes(originalLanguage.split("-")[0])), lang];
            }
            else {
                return [lang];
            }
        },
        ns: [
            "default",
            "commands",
            "components",
        ],
        interpolation: {
            escapeValue: false,
        },
        defaultNS: "default",
        backend: {
            loadPath: path_1.default.join(localesRoot, "{{lng}}/{{ns}}.json"),
        },
    });
}
function availableLanguages() {
    return supportedDiscordLocales;
}
//# sourceMappingURL=i18n.js.map