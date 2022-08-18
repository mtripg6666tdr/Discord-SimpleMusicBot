import * as fs from "fs";
import * as path from "path";
import * as config from "./config";

class LogStore{
  private readonly loggingStream = null as fs.WriteStream;
  
  constructor(){
    if(config.debug){
      if(!fs.existsSync(path.join(__dirname, "../../logs"))){
        fs.mkdirSync(path.join(__dirname, "../../logs"));
      }
      this.loggingStream = fs.createWriteStream(path.join(__dirname, `../../logs/log-${Date.now()}.txt`));
      process.on("exit", () => !this.loggingStream.destroyed && this.loggingStream.destroy());
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
  console[level](content);
  logStore.addLog(level[0].toUpperCase() + ":" + content);
}
