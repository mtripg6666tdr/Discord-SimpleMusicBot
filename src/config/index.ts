/*
 * Copyright 2021-2023 mtripg6666tdr
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

import type { AudioSourceTypeIdentifer } from "../AudioSource";
import type { Static } from "@sinclair/typebox";

import * as fs from "fs";
import * as path from "path";

import { TypeCompiler } from "@sinclair/typebox/compiler";
import { Value } from "@sinclair/typebox/value";
import CJSON from "comment-json";

import { ConfigSchema } from "./type";

const DEVELOPMENT_PHASE = false;

type StaticConfigSchema = Static<typeof ConfigSchema>;

type DefaultProvidedConfigPropertyNames =
  | "disabledSources"
  | "cacheLimit"
  | "maxLogFiles"
  | "proxy"
  | "botWhiteList"
  | "djRoleNames";

type DefaultProvidedConfigProperties = {
  [key in Exclude<DefaultProvidedConfigPropertyNames, "proxy">]: Exclude<StaticConfigSchema[key], null | undefined>
} & { proxy: string | null };

type ConfigObject = Omit<StaticConfigSchema, DefaultProvidedConfigPropertyNames> & {
  isBotAdmin: (userId: string) => boolean,
  isDisabledSource: (sourceIdentifer: AudioSourceTypeIdentifer) => boolean,
  isWhiteListedBot: (userId: string) => boolean,
  djRoleNames: string[],
} & DefaultProvidedConfigProperties;

class ConfigLoader {
  protected static _instance: ConfigLoader | null = null;
  protected _config: ConfigObject;

  protected constructor(){
    this.load();
  }

  static get instance(){
    if(this._instance){
      return this._instance;
    }else{
      return this._instance = new this();
    }
  }

  get config(){
    return this._config;
  }

  protected load(){
    const checker = TypeCompiler.Compile(ConfigSchema);

    const config = CJSON.parse(
      fs.readFileSync(path.join(__dirname, global.BUNDLED ? "../config.json" : "../../config.json"), { encoding: "utf-8" }),
      undefined,
      true
    );

    const errs = [...checker.Errors(config)];
    if(errs.length > 0){
      const er = new Error("Invalid config.json");
      console.log(errs);
      Object.defineProperty(er, "errors", {
        value: errs,
      });
      throw er;
    }

    if(DEVELOPMENT_PHASE && (!config || typeof config !== "object" || !("debug" in config) || !config.debug)){
      console.error("This is still in a development phase, and running without the debug mode is currently disabled.");
      console.error("You should use the latest version instead of the current branch.");
      console.error("If you understand exactly what you are doing, please enable the debug mode.");
      process.exit(1);
    }

    const defaultValues: DefaultProvidedConfigProperties = {
      disabledSources: [],
      cacheLimit: 500,
      maxLogFiles: 100,
      proxy: null,
      botWhiteList: [],
      djRoleNames: ["DJ"],
    };

    this._config = Object.assign(
      // empty object
      Object.create(null),
      // default options
      Value.Create(ConfigSchema),
      // optional options default value
      defaultValues,
      // loaded config
      config,
    ) as unknown as ConfigObject;
    this._config.isBotAdmin = (userId: string) => {
      if(!this._config.adminId){
        return userId === "593758391395155978";
      }
      return typeof this._config.adminId === "string" ? this._config.adminId === userId : this._config.adminId.includes(userId);
    };
    this._config.isDisabledSource = (sourceIdentifer: AudioSourceTypeIdentifer) => {
      return this._config.disabledSources.includes(sourceIdentifer);
    };
    this._config.isWhiteListedBot = (userId: string) => this._config.botWhiteList.includes(userId);
    Object.freeze(this._config);
  }
}

export function useConfig(){
  return ConfigLoader.instance.config;
}

export { GuildBGMContainerType } from "./type";
