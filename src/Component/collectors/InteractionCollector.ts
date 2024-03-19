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

import type { InteractionCollectorManager } from "./InteractionCollectorManager";
import type { ResponseMessage } from "../commandResolver/ResponseMessage";
import type { AnyTextableGuildChannel, ComponentInteraction, ComponentTypes, Message } from "oceanic.js";

import * as crypto from "crypto";

import { LogEmitter } from "../../Structure";

export interface InteractionCollectorEvents {
  customIdsCreate: [customIds: string[]];
  destroy: [];
  timeout: [];
}

export class InteractionCollector<T extends InteractionCollectorEvents = InteractionCollectorEvents> extends LogEmitter<T> {
  // <customId, componentId>
  protected customIdMap = new Map<string, string>();
  protected receivedCount = 0;
  protected maxReceiveCount = 1;
  protected userId: string | null = null;
  protected timer: NodeJS.Timeout | null = null;
  protected timeout: number | null = null;
  protected destroyed = false;
  protected _collectorId: string;
  protected resetTimeoutOnInteraction = false;
  protected message: Message<AnyTextableGuildChannel> | ResponseMessage | null = null;

  getCustomIds(){
    return [...this.customIdMap.keys()];
  }

  get collectorId(){
    return this._collectorId;
  }

  constructor(protected parent: InteractionCollectorManager){
    const collectorId = crypto.randomUUID();
    super("InteractionCollector", collectorId);
    this._collectorId = collectorId;
  }

  setMaxInteraction(count: number){
    this.maxReceiveCount = count;
    this.logger.debug(`max interaction count: ${count}`);
    return this;
  }

  setTimeout(timeout: number){
    if(this.timer){
      clearTimeout(this.timer);
    }
    this.logger.debug(`timeout: ${timeout}`);
    this.timer = setTimeout(() => {
      this.destroy();
      this.emit("timeout");
    }, timeout).unref();
    this.timeout = timeout;
    return this;
  }

  setAuthorIdFilter(userId: string | null = null){
    this.userId = userId;
    this.logger.debug(`author filter: ${this.userId}`);
    return this;
  }

  setResetTimeoutOnInteraction(reset: boolean){
    this.resetTimeoutOnInteraction = reset;
    return this;
  }

  createCustomIds<
    U extends Record<string, "button"|"selectMenu"> & { [key in keyof T]?: never }
  >(componentTypes: U): {
    customIdMap: { [key in keyof U]: string },
    collector: InteractionCollector<T & {
      [key in keyof U]: U[key] extends "button"
        ? [ComponentInteraction<ComponentTypes.BUTTON>]
        : [ComponentInteraction<ComponentTypes.STRING_SELECT>]
    }>,
  } {
    const existingComponentIds = [...this.customIdMap.values()];
    const componentIds = Object.keys(componentTypes) as (keyof U)[];
    if(componentIds.some(id => existingComponentIds.includes(id as string))){
      throw new Error("Duplicated key");
    }
    const customIds = Array.from({ length: componentIds.length }, () => `collector-${crypto.randomUUID()}`);
    const componentIdCustomIdMap = {} as { [key in keyof U]: string };
    customIds.forEach((customId, i) => {
      this.customIdMap.set(customId, componentIds[i] as string);
      componentIdCustomIdMap[componentIds[i]] = customId;
    });
    this.emit("customIdsCreate", customIds);
    this.logger.debug("customId created", componentIdCustomIdMap);
    return {
      customIdMap: componentIdCustomIdMap,
      collector: this,
    };
  }

  handleInteraction(interaction: ComponentInteraction<any, AnyTextableGuildChannel>){
    const componentId = this.customIdMap.get(interaction.data.customID);
    if(!componentId){
      this.logger.warn(`unknown custom id: ${interaction.data.customID}`);
      return;
    }else if(this.userId && interaction.member.id !== this.userId){
      this.logger.warn(`forbidden interaction; ignoring: ${interaction.data.customID}`);
      return;
    }
    this.logger.debug(`id mapped ${interaction.data.customID} => ${componentId}`);
    if(this.resetTimeoutOnInteraction && this.timeout){
      this.setTimeout(this.timeout);
    }
    this.emit(componentId as any, interaction);
    this.receivedCount++;
    if(this.receivedCount >= this.maxReceiveCount){
      this.destroy();
    }
  }

  setMessage(message: Message<AnyTextableGuildChannel> | ResponseMessage){
    this.message = message;
    return message;
  }

  destroy(){
    if(!this.destroyed){
      this.destroyed = true;
      this.emit("destroy");
      this.logger.debug("destroyed");
    }
    if(this.message){
      this.message.edit({
        components: [],
      }).catch(this.logger.error);
      this.message = null;
    }
    if(this.timer){
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
