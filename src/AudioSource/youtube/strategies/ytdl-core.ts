import * as HttpsProxyAgent from "https-proxy-agent";
import * as ytdl from "ytdl-core";
import { Cache, Strategy } from ".";
import * as voice from "@discordjs/voice";
import Util from "../../../Util";
import { ReadableStreamInfo, UrlStreamInfo } from "../../audiosource";
import { SecondaryUserAgent } from "../../../Util/ua";
import { Readable } from "stream";
import { createChunkedYTStream } from "../stream";
const ua = SecondaryUserAgent;

type ytdlCore = "ytdlCore";
const ytdlCore:ytdlCore = "ytdlCore";

export class ytdlCoreStrategy extends Strategy<Cache<ytdlCore, ytdl.videoInfo>>{
  async getInfo(url:string){
    const agent = Util.config.proxy && HttpsProxyAgent.default(Util.config.proxy);
    const requestOptions = agent ? {agent} : undefined;
    const info = await ytdl.getInfo(url, {
      lang: "ja",
      requestOptions,
    });
    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: ytdlCore,
        data: info,
      }
    };
  }

  async fetch(url: string, forceUrl: boolean = false, cache?: Cache<"ytdlCore", ytdl.videoInfo>){
    const info = await (() => {
      if(cache){
        return cache.data;
      }else{
        const agent = Util.config.proxy && HttpsProxyAgent.default(Util.config.proxy);
        const requestOptions = agent ? {agent} : undefined;
        return ytdl.getInfo(url, {
          lang: "ja",
          requestOptions,
        });
      }
    })();
    const format = ytdl.chooseFormat(info.formats, info.videoDetails.liveBroadcastDetails?.isLiveNow ? {
      filter: null,
      quality: null,
      isHLS: false
    } as ytdl.chooseFormatOptions : {
      filter: "audioonly",
      quality: "highestaudio",
    });
    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: info.related_videos.map(video => ({
        url: "https://www.youtube.com/watch?v=" + video.id,
        title: video.title,
        description: "関連動画として取得したため詳細は表示されません",
        length: video.length_seconds,
        channel: (video.author as ytdl.Author)?.name,
        channelUrl: (video.author as ytdl.Author)?.channel_url,
        thumbnail: video.thumbnails[0].url,
        isLive: video.isLive
      })).filter(v => !v.isLive),
    };
    if(forceUrl){
      return {
        ...partialResult,
        stream: {
          type: "url",
          url: format.url,
          userAgent: ua,
        } as UrlStreamInfo
      };
    }else{
      let readable = null as Readable;
      if(info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow){
        readable = ytdl.downloadFromInfo(info, {format, lang: "ja"});
      }else{
        readable = createChunkedYTStream(info, format, {lang: "ja"}, 1 * 1024 * 1024);
      }
      return {
        ...partialResult,
        stream: {
          type: "readable",
          stream: readable,
          streamType: format.container === "webm" && format.audioCodec === "opus" ? voice.StreamType.WebmOpus : undefined
        } as ReadableStreamInfo
      };
    }
  }

  protected mapToExportable(url:string, info:ytdl.videoInfo){
    return {
      url,
      title: info.videoDetails.title,
      description: info.videoDetails.description,
      length: Number(info.videoDetails.lengthSeconds),
      channel: info.videoDetails.ownerChannelName,
      channelUrl: info.videoDetails.author.channel_url,
      thumbnail: info.videoDetails.thumbnails[0].url,
      isLive: info.videoDetails.isLiveContent && info.videoDetails.liveBroadcastDetails?.isLiveNow,
    };
  }
}