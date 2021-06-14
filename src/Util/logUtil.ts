class LogStore{
  log:boolean = true;
  maxLength = 30;
  data:string[] = [];
  addLog(log:string){
    this.data.push(log);
    if(this.data.length > this.maxLength){
      this.data.shift();
    }
  }
}

export var logStore = new LogStore();

export function log(content:string, level:"log"|"warn"|"error" = "log"){
  if(!logStore.log && level === "log") return;
  console[level](content);
  logStore.addLog(level[0].toUpperCase() + ":" + content);
}