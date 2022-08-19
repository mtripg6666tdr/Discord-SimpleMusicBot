import type { exportableYouTube } from "..";
import type { UrlStreamInfo } from "../../audiosource";
import type { Cache } from "./base";
import type { InfoData } from "play-dl";

import { video_info } from "play-dl";

import { Util } from "../../../Util";
import { Strategy } from "./base";

type playDl = "playDl";
const playDl:playDl = "playDl";

export class playDlStrategy extends Strategy<Cache<playDl, InfoData>, InfoData> {
  async getInfo(url:string){
    this.useLog();
    const t = Util.time.timer.start(`YouTube(Strategy#${this.priority})#getInfo`);
    let info = null as InfoData;
    try{
      info = await video_info(url);
    }
    finally{
      t.end(this.logger);
    }
    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: playDl,
        data: info,
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(url:string, forceUrl:boolean = false, cache?: Cache<any, any>){
    this.useLog();
    const t = Util.time.timer.start(`YouTube(Strategy#${this.priority})#fetch`);
    let info = null as InfoData;
    try{
      const cacheAvailable = cache?.type === playDl && cache.data;
      this.logger(`[AudioSource:youtube] ${cacheAvailable ? "using cache without obtaining" : "obtaining info"}`);
      info = cacheAvailable || await video_info(url);
    }
    finally{
      t.end(this.logger);
    }
    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: null as exportableYouTube[],
    };
    const format = info.format.filter(f => f.mimeType.startsWith("audio"));
    if(format.length === 0) throw new Error("no format found!");
    format.sort((fa, fb) => fb.bitrate - fa.bitrate);
    return {
      ...partialResult,
      stream: {
        type: "url",
        url: format[0].url,
      } as UrlStreamInfo
    };
  }

  protected mapToExportable(url:string, info:InfoData):exportableYouTube{
    if(info.video_details.upcoming) throw new Error("This video is still in upcoming");
    return {
      url,
      title: info.video_details.title,
      description: info.video_details.description,
      length: Number(info.video_details.durationInSec),
      channel: info.video_details.channel?.name || "不明",
      channelUrl: info.video_details.channel?.url || "",
      thumbnail: info.video_details.thumbnails[0].url,
      isLive: info.video_details.live,
    };
  }
}
