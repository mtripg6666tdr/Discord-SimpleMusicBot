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

import type { EventDictionary } from "./TypedEmitter";
import type { LoggerObject } from "../logger";

import TypedEventEmitter from "./TypedEmitter";
import { getLogger } from "../logger";

export abstract class LogEmitter<Events extends EventDictionary> extends TypedEventEmitter<Events> {
  protected logger: LoggerObject;
  private guildId: string = null;

  constructor(tag: string, guildId?: string){
    super();
    this.logger = getLogger(tag);
    if(guildId){
      this.setGuildId(guildId);
    }
  }

  protected setGuildId(guildId: string){
    if(!this.logger){
      throw new Error("Logger is not defined");
    }
    this.logger.addContext("guildId", guildId);
    this.guildId = guildId;
  }

  getGuildId(){
    return this.guildId;
  }
}
