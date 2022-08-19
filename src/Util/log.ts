import * as fs from "fs";
import * as path from "path";
import { isMainThread } from "worker_threads";
import * as config from "./config";

export type LoggerType = (content:string, level?:"log"|"warn"|"error")=>void;

class LogStore{
  private readonly loggingStream = null as fs.WriteStream;
  
  constructor(){
    if(config.debug && isMainThread){
      if(!fs.existsSync(path.join(__dirname, "../../logs"))){
        fs.mkdirSync(path.join(__dirname, "../../logs"));
      }
      this.loggingStream = fs.createWriteStream(path.join(__dirname, `../../logs/log-${Date.now()}.txt`));
      process.on("exit", () => {
        this.loggingStream.write(Buffer.from("[Logger] detect process exiting, closing stream..."))
        if(!this.loggingStream.destroyed) this.loggingStream.destroy()
      });
    }
  }

  log:boolean = true;
  maxLength = 30;
  data:string[] = [];
  
  addLog(log:string){
    this.data.push(log);
    if(this.data.length > this.maxLength){
      this.data.shift();
    }
    if(this.loggingStream && !this.loggingStream.destroyed){
      this.loggingStream.write(Buffer.from(log + "\r\n"));
    }
  }
}

export const logStore = new LogStore();

export function log(content:string, level:"log"|"warn"|"error" = "log"){
  if(!logStore.log && level === "log") return;
  if(content.length < 200){
    console[level](content);
  }else{
    console.warn("[Logger] truncated because content was too big; see logs directory to get complete logs (if not exists, make sure debug is set true in config.json)");
  }
  logStore.addLog(level[0].toUpperCase() + ":" + content);
}
