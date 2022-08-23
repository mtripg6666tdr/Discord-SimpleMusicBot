import type { exportableYouTube } from "..";
import type { LoggerType } from "../../../Util";
import type { StreamInfo } from "../../audiosource";

import { Util } from "../../../Util";

export type Cache<T extends string, U> = {
  type:T,
  data:U,
};

export abstract class Strategy<T extends Cache<any, U>, U> {
  public logger: LoggerType;
  abstract get cacheType():string;

  constructor(protected priority:number){
    this.logger = Util.logger.log.bind(Util.logger);
  }

  abstract getInfo(url:string):Promise<{
    data:exportableYouTube,
    cache:T,
  }>;
  
  abstract fetch(url:string, forceCache?: boolean, cache?:Cache<any, any>):Promise<{
    stream:StreamInfo,
    info:exportableYouTube,
    relatedVideos:exportableYouTube[],
  }>;
  
  protected useLog(){
    this.logger("[AudioSource:youtube] using strategy #" + this.priority);
  }

  protected abstract mapToExportable(url:string, info:U):exportableYouTube;
}
