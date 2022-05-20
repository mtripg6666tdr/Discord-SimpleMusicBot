import type { EmbedField } from "discord.js";
import type { StreamInfo } from ".";

import { PassThrough, Readable } from "stream";
import * as voice from "@discordjs/voice";
import * as HttpsProxyAgent from "https-proxy-agent";
import * as ytdl from "ytdl-core";
import m3u8stream from "m3u8stream";

import { Util } from "../Util";
import { SecondaryUserAgent } from "../Util/ua";
import { AudioSource } from "./audiosource";
import { createChunkedYTStream } from "./youtube.stream";
import { getYouTubeDlInfo, YoutubeDlInfo } from "./youtube.fallback";

const ua = SecondaryUserAgent;
export class YouTube extends AudioSource {
  // サービス識別子（固定）
  protected readonly _serviceIdentifer = "youtube";
  protected _lengthSeconds = 0;
  private fallback = false;
  private ytdlInfo = null as ytdl.videoInfo;
  private youtubeDlInfo = null as YoutubeDlInfo;
  ChannelName:string;
  ChannelUrl:string;
  Thumnail:string;
  LiveStream:boolean;
  relatedVideos:exportableYouTube[] = [];
  get IsFallbacked(){
    return this.fallback;
  }
  get IsCached(){
    return Boolean(this.ytdlInfo || this.youtubeDlInfo);
  }

  async init(url:string, prefetched:exportableYouTube, forceCache?:boolean){
    this.Url = "https://www.youtube.com/watch?v=" + ytdl.getVideoID(url);
    if(prefetched){
      this.Title = prefetched.title;
      this.Description = prefetched.description;
      this._lengthSeconds = prefetched.length;
      this.ChannelName = prefetched.channel;
      this.ChannelUrl = prefetched.channelUrl;
      this.Thumnail = prefetched.thumbnail;
      this.LiveStream = prefetched.isLive;
    }else{
      const agent = Util.config.proxy && HttpsProxyAgent.default(Util.config.proxy);
      const requestOptions = agent ? {agent} : undefined;
      try{
        const t = Util.time.timer.start("YouTube(AudioSource)#init->GetInfo");
        let info = await ytdl.getInfo(url, {
          lang: "ja", requestOptions
        });
        t.end();
        if(forceCache) this.ytdlInfo = info;
        this.Title = info.videoDetails.title;
        this.Description = info.videoDetails.description;
        this._lengthSeconds = Number(info.videoDetails.lengthSeconds ?? 0);
        this.ChannelName = info.videoDetails.ownerChannelName;
        this.ChannelUrl = info.videoDetails.author.channel_url;
        this.Thumnail = info.videoDetails.thumbnails[0].url;
        this.LiveStream = info.videoDetails.isLiveContent && info.videoDetails.liveBroadcastDetails?.isLiveNow;
        this.fallback = false;
      }
      catch{
        this.fallback = true;
        Util.logger.log("ytdl.getInfo() failed, fallback to youtube-dl", "warn");
        const t = Util.time.timer.start("YouTube(AudioSource)#init->GetInfo(Fallback)");
        const info = JSON.parse(await getYouTubeDlInfo(this.Url)) as YoutubeDlInfo;
        t.end();
        if(forceCache) this.youtubeDlInfo = info;
        this.LiveStream = info.is_live;
        this.Title = info.title;
        this.Description = info.description;
        this._lengthSeconds = Number(info.duration);
        this.ChannelName = info.channel;
        this.ChannelUrl = info.channel_url;
        this.Thumnail = info.thumbnail;
      }
    }
    return this;
  }

  async fetch(url?:boolean):Promise<StreamInfo>{
    try{
      let info = this.ytdlInfo;
      if(!info){
        // no cache then get
        const agent = Util.config.proxy && HttpsProxyAgent.default(Util.config.proxy);
        const requestOptions = agent ? {agent} : undefined;  
        const t = Util.time.timer.start("YouTube(AudioSource)#fetch->GetInfo");
        info = await ytdl.getInfo(this.Url, {
          lang: "ja", requestOptions
        })
        t.end();
      }
      // store related videos
      this.relatedVideos = info.related_videos.map(video => ({
        url: "https://www.youtube.com/watch?v=" + video.id,
        title: video.title,
        description: "関連動画として取得したため詳細は表示されません",
        length: video.length_seconds,
        channel: (video.author as ytdl.Author)?.name,
        channelUrl: (video.author as ytdl.Author)?.channel_url,
        thumbnail: video.thumbnails[0].url,
        isLive: video.isLive
      })).filter(v => !v.isLive);
      // update description
      this.Description = info.videoDetails.description ?? "不明";
      // update is live status
      this.LiveStream = info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow;
      // update title
      this.Title = info.videoDetails.title;
      // format selection
      const format = ytdl.chooseFormat(info.formats, {
        filter: this.LiveStream ? null : "audioonly",
        quality: this.LiveStream ? null : "highestaudio",
        isHLS: this.LiveStream,
      } as ytdl.chooseFormatOptions);
      Util.logger.log(`[AudioSource:youtube]Format: ${format.itag}, Bitrate: ${format.bitrate}bps, Audio codec:${format.audioCodec}, Container: ${format.container}`);
      if(url){
        // return url when forced it
        this.fallback = false;
        Util.logger.log("[AudioSource:youtube]Returning the url instead of stream");
        return {
          type: "url",
          url: format.url,
          userAgent: ua
        }
      }else{
        // otherwise return readable stream
        let readable = null as Readable;
        if(info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow){
          readable = ytdl.downloadFromInfo(info, {format, lang: "ja"});
        }else{
          readable = createChunkedYTStream(info, format, {lang: "ja"}, 1 * 1024 * 1024);
        }
        this.fallback = false;
        return {
          type: "readable",
          stream: readable,
          streamType: format.container === "webm" && format.audioCodec === "opus" ? voice.StreamType.WebmOpus : undefined
        };
      }
    }
    catch{
      this.fallback = true;
      Util.logger.log("ytdl.getInfo() failed, fallback to youtube-dl", "warn");
      const t = Util.time.timer.start("YouTube(AudioSource)#fetch->GetInfo(Fallback)");
      const info = this.youtubeDlInfo ?? JSON.parse(await getYouTubeDlInfo(this.Url)) as YoutubeDlInfo;
      t.end();
      this.Description = info.description ?? "不明";
      if(info.title) this.Title = info.title;
      if(info.is_live){
        const format = info.formats.filter(f => f.format_id === info.format_id);
        if(url){
          return {
            type: "url",
            url: format[0].url
          }
        }
        const stream = new PassThrough({highWaterMark: 1024 * 512});
        stream._destroy = () => { stream.destroyed = true; };
        const req = m3u8stream(format[0].url, {
          begin: Date.now(),
          parser: "m3u8"
        });
        req
          .on("error", (e) => stream.emit("error", e))
          .pipe(stream)
          .on('error', (e) => stream.emit("error", e));
        return {
          type: "readable",
          stream,
        };
      }else{
        const format = info.formats.filter(f => f.format_note==="tiny");
        format.sort((fa, fb) => fb.abr - fa.tbr);
        return {
          type: "url",
          url: format[0].url
        };
      }
    }
  }

  async fetchVideo(){
    let info = this.ytdlInfo;
    if(!info){
      const agent = Util.config.proxy && HttpsProxyAgent.default(Util.config.proxy);
      const requestOptions = agent ? {agent} : undefined;  
      info = await ytdl.getInfo(this.Url, {
        lang: "ja", requestOptions
      })
    }
    const isLive = info.videoDetails.liveBroadcastDetails && info.videoDetails.liveBroadcastDetails.isLiveNow;
    const format = ytdl.chooseFormat(info.formats, {
      quality: isLive ? null : "highestvideo",
      isHLS: isLive
    } as ytdl.chooseFormatOptions);
    const { url } = format;
    return {url, ua};
  }

  toField(verbose:boolean = false){
    const fields = [] as EmbedField[];
    fields.push({
      name: ":cinema:チャンネル名",
      value: this.ChannelUrl ? `[${this.ChannelName}](${this.ChannelUrl})` : this.ChannelName,
      inline: false
    }, {
      name: ":asterisk:概要",
      value: this.Description.length > (verbose ? 4000 : 350) ? this.Description.substring(0, (verbose ? 4000 : 300)) + "..." : this.Description,
      inline: false
    });
    return fields;
  }

  npAdditional(){
    return "\r\nチャンネル名:`" + this.ChannelName + "`";
  }

  exportData():exportableYouTube{
    return {
      url: this.Url,
      title: this.Title,
      description: this.Description,
      length: this.LengthSeconds,
      channel: this.ChannelName,
      channelUrl: this.ChannelUrl,
      thumbnail: this.Thumnail,
      isLive: this.LiveStream,
    };
  };

  disableCache(){
    this.ytdlInfo = null;
    this.youtubeDlInfo = null;
  }
}

export type exportableYouTube = {
  url:string;
  title:string;
  description:string;
  length:number;
  channel:string;
  channelUrl:string;
  thumbnail:string;
  isLive:boolean;
}