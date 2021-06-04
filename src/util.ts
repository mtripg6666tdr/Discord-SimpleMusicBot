import { Client, Message, MessageEmbed, TextChannel } from "discord.js";
import * as os from "os";
import * as https from "https";
import { GuildVoiceInfo } from "./definition";

// Returns min and sec from total sec
export function CalcMinSec(_t:number){
  const sec = _t % 60;
  const min = (_t - sec) / 60;
  return [AddZero(min.toString(), 2), AddZero(sec.toString(), 2)];
}

export function AddZero(str:string, length:number){
  if(str.length >= length) return str;
  while(str.length < length){
    str = "0" + str;
  }
  return str;
}

// Returns hour, min, sec and millisec from total millisec
export function CalcTime(date:number){
  const millisec = date % 1000;
  var ato = (date - millisec) / 1000;
  const sec = ato % 60;
  ato = (ato - sec) / 60;
  const min = ato % 60;
  const hour = (ato - min) / 60;
  return [hour, min, sec, millisec];
}

class LogStore{
  data:string[] = [];
  addLog(log:string){
    this.data.push(log +"\r\n");
    if(this.data.length > 30){
      this.data = this.data.slice(1 , this.data.length);
    }
  }
}

export var logStore = new LogStore();

export function log(content:string, level:"log"|"warn"|"error" = "log"){
  console[level](content);
  logStore.addLog(level + ":" + content);
}

type MemoryUsageInfo = {free:number,total:number,used:number,usage:number};

export function GetMemInfo():MemoryUsageInfo{
  var memory = {} as MemoryUsageInfo;
  memory.free = GetMBytes(os.freemem());
  memory.total = GetMBytes(os.totalmem());
  memory.used = memory.total - memory.free;
  memory.usage = GetPercentage(memory.used, memory.total);
  return memory;
}

export function GetMBytes(bytes:number) {
  return Math.round(bytes / 1024/*KB*/ / 1024/*MB*/ * 100) / 100;
}

export function GetPercentage(part:number, total:number){
  return Math.round(part / total * 100 * 100) / 100;
}

export function btoa(txt:string){
  return Buffer.from(txt).toString("base64");
}

export const SoundCloudDescription = "指定されたSoundCloud URL";
export const CustomDescription = "指定されたオーディオファイル";

export function DownloadText(url:string):Promise<string>{
  return new Promise((resolve,reject)=>{
    https.get(url, res => {
      var data = "";
      res.on("data", chunk =>{
        data += chunk;
      });
      res.on("end", ()=>{
        resolve(data);
      });
      res.on("error", reject);
    }).on("error", reject);
  })
}