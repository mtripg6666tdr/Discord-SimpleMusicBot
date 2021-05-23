import * as ytdl from "ytdl-core";
import { QueueContent, ytdlVideoInfo } from "../definition";

export class QueueManager {
  private _default:QueueContent[] = [];
  get default():QueueContent[] {
    return this._default;
  }
  LoopEnabled:boolean = false;
  QueueLoopEnabled:boolean = false;
  get length():number {
    return this.default.length;
  }

  constructor(){

  }

  async AddQueue(url:string, addedBy:string):Promise<ytdlVideoInfo>{
    const info = (await ytdl.getInfo(url, {lang: "ja"}));
    this.default.push({
      addedBy: addedBy,
      info: info.videoDetails,
      formats: info.formats
    });
    return info.videoDetails;
  }

  async AddQueueFirst(url:string, addedBy:string):Promise<ytdlVideoInfo>{
    const info = (await ytdl.getInfo(url, {lang: "ja"}));
    this._default = [{
      addedBy: addedBy,
      info: info.videoDetails as ytdlVideoInfo,
      formats: info.formats
    }].concat(this.default);
    return info.videoDetails;
  }

  Next(){
    if(this.QueueLoopEnabled){
      this.default.push(this.default[0]);
    }
    this._default = this.default.slice(1, this.default.length);
  }

  RemoveAt(offset:number){
    this._default = this.default.slice(0,offset).concat(this.default.slice(offset + 1, this.default.length));
  }

  RemoveAll(){
    this._default = [];
  }
}