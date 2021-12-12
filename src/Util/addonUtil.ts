import { Client, Interaction, Message } from "discord.js";
import { EventEmitter } from "stream";
import * as fs from "fs";
import * as path from "path";

interface EventKeys {
  ready: [client:Client<true>];
  messageCreate: [message: Message];
  interactionCreate: [interaction: Interaction];
}
export class addOn extends EventEmitter {  
  on<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any):this{
    super.on(event, callback);
    return this;
  }
  off<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any) {
    super.off(event, callback);
    return this;
  }
  once<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any) {
    super.once(event, callback);
    return this;
  }
  addListener<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any) {
    super.addListener(event, callback);
    return this;
  }
  removeListener<T extends keyof EventKeys>(event:T, callback:(...args:EventKeys[T])=>any) {
    super.removeListener(event, callback);
    return this;
  }
  removeAllListeners<T extends keyof EventKeys>(event:T) {
    super.removeAllListeners(event);
    return this;
  }
  emit<T extends keyof EventKeys>(event:T, ...args:EventKeys[T]){
    return super.emit(event, args);
  }

  constructor(){
    super({captureRejections: false});
    try{
      fs.readdirSync(path.join(__dirname, "../../addon/"), {withFileTypes: true})
      .filter(d => d.isFile())
      .map(d => require("../../addon/" + d.name.slice(0, -3)))
      .filter(d => typeof d === "function")
      .forEach(d => {
        try {
          d(this);
        }
        catch{}
      });
    }
    catch{
    }
  }
}