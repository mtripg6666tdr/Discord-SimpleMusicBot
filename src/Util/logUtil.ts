import { performance } from "perf_hooks";

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

export const logStore = new LogStore();

export function log(content:string, level:"log"|"warn"|"error" = "log"){
  if(!logStore.log && level === "log") return;
  console[level](content);
  logStore.addLog(level[0].toUpperCase() + ":" + content);
}

class _timerStore {
  private timers = {} as {[key:string]:number};

  start(key:string){
    this.timers[key] = performance.now();
    return new timerStopper(this, key);
  }

  end(key:string){
    if(this.timers[key]){
      log("[Timer]Elapsed " + (Math.floor((performance.now() - this.timers[key]) * 100) / 100) + "ms. (" + key + ")");
      delete this.timers[key];
    }
  }
}

class timerStopper {
  constructor(private parent:_timerStore, private key:string){
    //
  }
  end(){
    this.parent.end(this.key);
  }
}

export const timer = new _timerStore();