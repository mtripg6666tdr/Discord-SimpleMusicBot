class LogStore{
  log:boolean = false;
  data:string[] = [];
  addLog(log:string){
    if(!this.log) return;
    this.data.push(log);
    if(this.data.length > 30){
      //this.data = this.data.slice(1 , this.data.length);
      this.data.shift();
    }
  }
}

export var logStore = new LogStore();

export function log(content:string, level:"log"|"warn"|"error" = "log"){
  console[level](content);
  logStore.addLog(level + ":" + content);
}