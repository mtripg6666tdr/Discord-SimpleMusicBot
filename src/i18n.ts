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

import type { Locale } from "oceanic.js";

import fs from "fs";
import path from "path";

import i18next from "i18next";
import Backend from "i18next-fs-backend";

// Ref: https://stackoverflow.com/questions/60131681/make-sure-array-has-all-types-from-a-union
const arrayOfAll = <T>() => <U extends T[]>(
  array: U & ([T] extends [U[number]] ? unknown : "Invalid") & { 0: T }
) => array;

export const discordLanguages: readonly string[] = arrayOfAll<Locale>()([
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

const localesRoot = path.join(__dirname, "../locales/");
const lngsInLocalesDirectory = fs.readdirSync(localesRoot, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .flatMap(d => d.name);
const supportedDiscordLocales = discordLanguages.filter(lang => {
  if (lang.includes("-")) {
    return lngsInLocalesDirectory.includes(lang);
  } else {
    return lngsInLocalesDirectory.some(directoryLang => directoryLang.split("-")[0] === lang);
  }
});

export function initLocalization(debug: boolean, lang: string) {
  return i18next
    .use(Backend)
    .init({
      debug,
      cleanCode: true,
      load: "all",
      supportedLngs: lngsInLocalesDirectory.flatMap(dirLang => dirLang.includes("-") ? [dirLang.split("-")[0], dirLang] : [dirLang]),
      preload: lngsInLocalesDirectory,
      fallbackLng: originalLanguage => {
        if (typeof originalLanguage === "string") {
          return [...lngsInLocalesDirectory.filter(dirLang => dirLang.includes(originalLanguage.split("-")[0])), lang];
        } else {
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
        loadPath: path.join(localesRoot, "{{lng}}/{{ns}}.json"),
      },
    });
}

export function availableLanguages() {
  return supportedDiscordLocales;
}
