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

import type { EventDictionary } from "./TypedEmitter";
import type { LoggerObjectWithContext } from "../logger";

import TypedEventEmitter from "./TypedEmitter";
import { getLogger } from "../logger";

export abstract class LogEmitter<Events extends EventDictionary> extends TypedEventEmitter<Events> {
  protected logger: LoggerObjectWithContext;
  private guildId: string | null = null;

  constructor(tag: string, id?: string | null){
    super();
    this.logger = getLogger(tag, true);
    if(id){
      this.setGuildId(id);
    }
  }

  protected setGuildId(guildId: string){
    if(!this.logger){
      throw new Error("Logger is not defined");
    }
    this.logger.addContext("id", guildId);
    this.guildId = guildId;
  }

  getGuildId(){
    if(!this.guildId){
      throw new Error("Cannot read guild id before guild id initialized.");
    }

    return this.guildId;
  }
}
