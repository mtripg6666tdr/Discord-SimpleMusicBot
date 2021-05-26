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

  async AddQueue(url:string, addedBy:string, method:"push"|"unshift" = "push"):Promise<ytdlVideoInfo>{
    var info;
    if(url.indexOf("youtube.com") >= 0){
      info = (await ytdl.getInfo(url, {lang: "ja"}));
      this.default[method]({
        addedBy: addedBy,
        info: info.videoDetails,
        formats: info.formats
      });
      return info.videoDetails;
    }else if(url.indexOf("soundcloud") >= 0){
      const info = {
        likes: 0,
        dislikes: 0,
        description: "指定されたSoundCloud URL",
        title: "SoundCloud ストリーム (" + url + ")",
        video_url: url,
        lengthSeconds: "0",
        thumbnails:[{
          url: "https://cdn.discordapp.com/attachments/757824315294220329/846737267951271946/Audio_icon-icons.com_71845.png",
          width: 256,
          height: 256
        }],
        isLiveContent: false
      };
      this.default[method]({
        addedBy: addedBy,
        info: info,
        formats: null
      });
      return info;
    }else{
      const info = {
        likes: 0,
        dislikes: 0,
        description: "指定されたオーディオファイル",
        title: "カスタムストリーム (" + url + ")",
        video_url: url,
        lengthSeconds: "0",
        thumbnails:[{
          url: "https://cdn.discordapp.com/attachments/757824315294220329/846737267951271946/Audio_icon-icons.com_71845.png",
          width: 256,
          height: 256
        }],
        isLiveContent: false
      };
      this.default[method]({
        addedBy: addedBy,
        info: info,
        formats: null
      });
      return info;
    }
  }

  async AddQueueFirst(url:string, addedBy:string):Promise<ytdlVideoInfo>{
    return this.AddQueue(url, addedBy, "unshift");
  }

  Next(){
    if(this.QueueLoopEnabled){
      this.default.push(this.default[0]);
    }
    this._default.shift();
  }

  RemoveAt(offset:number){
    this._default.splice(offset, 1);
  }

  RemoveAll(){
    this._default = [];
  }
}