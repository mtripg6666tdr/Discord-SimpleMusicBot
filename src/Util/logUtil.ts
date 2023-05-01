class LogStore{
  log: boolean = true;
  maxLength = 30;
  data: string[] = [];
  addLog(logEvent: string){
    this.data.push(logEvent);
    if(this.data.length > this.maxLength){
      this.data.shift();
    }
  }
}

export const logStore = new LogStore();

export function log(content: string, level: "log"|"warn"|"error" = "log"){
  if(!logStore.log && level === "log") return;
  console[level](content);
  logStore.addLog(level[0].toUpperCase() + ":" + content);
}
