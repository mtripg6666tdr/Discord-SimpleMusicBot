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
      log("[TimeLogger]Elapsed " + (Math.floor((performance.now() - this.timers[key]) * 100) / 100) + "ms. (" + key + ")");
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

export abstract class LogEmitter {
  private tag:string = "";
  private guildId:string = "";
  /**
   * ログに使用するタグを設定します
   * @param tag タグ
   */
  SetTag(tag:string){
    this.tag = tag;
  }
  
  /**
   * ログに使用するサーバーIDを設定します（存在する場合）
   * @param id id
   */
  SetGuildId(id:string){
    this.guildId = id;
  }

  /**
   * ログを出力します
   * @param message メッセージ
   */
  Log(message:string, level?:"log"|"warn"|"error"){
    if(this.tag === "") throw new Error("Tag has not been specified");
    log(`[${this.tag}${this.guildId !== "" ? `/${this.guildId}` : ""}]${message}`, level);
  }
}