import { execSync } from "child_process";
import { EmbedField } from "discord.js";
import * as ytdl from "ytdl-core";
import { log } from "../Util/logUtil";
import { AudioSource } from "./audiosource";

export class YouTube extends AudioSource {
  protected _serviceIdentifer = "youtube";
  protected _lengthSeconds = 0;
  private fallback = false;
  ChannelName:string;
  Like:number;
  Dislike:number;
  Thumnail:string;
  LiveStream:boolean;

  toField(verbose:boolean = false){
    const fields = [] as EmbedField[];
    fields.push({
      name: ":cinema:チャンネル名",
      value: this.ChannelName,
      inline: false
    }, {
      name: ":asterisk:概要",
      value: this.Description.length > (verbose ? 1000 : 350) ? this.Description.substring(0, (verbose ? 1000 : 300)) + "..." : this.Description,
      inline: false
    });
    if(this.Like !== -1){
      fields.push({
        name: "⭐評価",
        value: ":+1:" + this.Like + "/:-1:" + this.Dislike,
        inline: false
      });
    }
    return fields;
  }

  async fetch(){
    try{
      const info = await ytdl.getInfo(this.Url)
      const format = ytdl.chooseFormat(info.formats, {
        filter: this.LiveStream ? null : "audioonly",
        quality: this.LiveStream ? null : "highestaudio",
        isHLS: this.LiveStream
      } as any);
      console.log(format);
      return ytdl.downloadFromInfo(info, {
        format: format
      });
    }
    catch{
      log("ytdl.getInfo() failed, fallback to youtube-dl", "warn");
      const info = JSON.parse(await getYouTubeDlInfo(this.Url)) as YoutubeDlInfo;
      var format = info.formats.filter(f => f.format_note==="tiny");
      format.sort((fa, fb) => fb.abr - fa.tbr);
      return format[0].url;
    }
  }

  async init(url:string, prefetched:exportableYouTube){
    this.Url = "https://www.youtube.com/watch?v=" + ytdl.getVideoID(url);
    if(prefetched){
      this.Title = prefetched.title;
      this.Description = prefetched.description;
      this._lengthSeconds = prefetched.length;
      this.ChannelName = prefetched.channel;
      this.Thumnail = prefetched.thumbnail;
      this.LiveStream = prefetched.isLive;
      this.Like = -1;
      this.Dislike = -1;
    }else{
      try{
        const info = await ytdl.getInfo(url, {lang: "ja"});
        this.Title = info.videoDetails.title;
        this.Description = info.videoDetails.description;
        this._lengthSeconds = Number(info.videoDetails.lengthSeconds);
        this.ChannelName = info.videoDetails.ownerChannelName;
        this.Like = info.videoDetails.likes;
        this.Dislike = info.videoDetails.dislikes;
        this.Thumnail = info.videoDetails.thumbnails[0].url;
        this.LiveStream = info.videoDetails.isLiveContent;
      }
      catch{
        this.fallback = true;
        log("ytdl.getInfo() failed, fallback to youtube-dl", "warn");
        const info = JSON.parse(await getYouTubeDlInfo(this.Url)) as YoutubeDlInfo;
        if(info.is_live) throw "YouTube-DL fallback currently doesn't support live stream";
        this.Title = info.title;
        this.Description = info.description;
        this._lengthSeconds = Number(info.duration);
        this.ChannelName = info.channel;
        this.Like = info.like_count;
        this.Dislike = info.dislike_count;
        this.Thumnail = info.thumbnail;
        this.LiveStream = false;
      }
    }
    return this;
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
      thumbnail: this.Thumnail,
      isLive: this.LiveStream
    };
  };
}

export type exportableYouTube = {
  url:string;
  title:string;
  description:string;
  length:number;
  channel:string;
  thumbnail:string;
  isLive:boolean
}

function execAsync(command:string):Promise<string>{
  return new Promise((resolve, reject) => {
    try{
      resolve(execSync(command).toString());
    }
    catch(e){
      reject(e);
    }
  });
}

async function getYouTubeDlInfo(url:string):Promise<Promise<string>>{
  try{
    await execAsync("youtube-dl --version");
    return execAsync("youtube-dl --skip-download --print-json \"" + this.Url + "\"");
  }
  catch{
    throw "Main library threw an error and fallback library was not found or occurred an error";
  }
}

interface YoutubeDlInfo {
  id:                   string;
  title:                string;
  formats:              Format[];
  thumbnails:           Thumbnail[];
  description:          string;
  upload_date:          string;
  uploader:             string;
  uploader_id:          string;
  uploader_url:         string;
  channel_id:           string;
  channel_url:          string;
  duration:             number;
  view_count:           number;
  average_rating:       number;
  age_limit:            number;
  webpage_url:          string;
  categories:           string[];
  tags:                 string[];
  is_live:              null;
  automatic_captions:   { [key: string]: AutomaticCaption[] };
  subtitles:            Subtitles;
  like_count:           number;
  dislike_count:        number;
  channel:              string;
  track:                string;
  artist:               string;
  album:                string;
  creator:              string;
  alt_title:            string;
  extractor:            string;
  webpage_url_basename: string;
  extractor_key:        string;
  playlist:             null;
  playlist_index:       null;
  thumbnail:            string;
  display_id:           string;
  requested_subtitles:  null;
  requested_formats:    Format[];
  format:               string;
  format_id:            string;
  width:                number;
  height:               number;
  resolution:           null;
  fps:                  number;
  vcodec:               string;
  vbr:                  number;
  stretched_ratio:      null;
  acodec:               Acodec;
  abr:                  number;
  ext:                  TempEXT;
  fulltitle:            string;
  _filename:            string;
}

enum Acodec {
  Mp4A402 = "mp4a.40.2",
  None = "none",
  Opus = "opus",
}

interface AutomaticCaption {
  ext: AutomaticCaptionEXT;
  url: string;
}

enum AutomaticCaptionEXT {
  Srv1 = "srv1",
  Srv2 = "srv2",
  Srv3 = "srv3",
  Ttml = "ttml",
  Vtt = "vtt",
}

enum TempEXT {
  M4A = "m4a",
  Mp4 = "mp4",
  Webm = "webm",
}

interface Format {
  asr:                 number | null;
  filesize:            number;
  format_id:           string;
  format_note:         string;
  fps:                 number | null;
  height:              number | null;
  quality:             number;
  tbr:                 number;
  url:                 string;
  width:               number | null;
  ext:                 TempEXT;
  vcodec:              string;
  acodec:              Acodec;
  abr?:                number;
  downloader_options?: DownloaderOptions;
  container?:          Container;
  format:              string;
  protocol:            Protocol;
  http_headers:        HTTPHeaders;
  vbr?:                number;
}

enum Container {
  M4ADash = "m4a_dash",
  Mp4Dash = "mp4_dash",
  WebmDash = "webm_dash",
}

interface DownloaderOptions {
  http_chunk_size: number;
}

interface HTTPHeaders {
  "User-Agent":      string;
  "Accept-Charset":  AcceptCharset;
  Accept:            Accept;
  "Accept-Encoding": AcceptEncoding;
  "Accept-Language": AcceptLanguage;
}

enum Accept {
  TextHTMLApplicationXHTMLXMLApplicationXMLQ09Q08 = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

enum AcceptCharset {
  ISO88591UTF8Q07Q07 = "ISO-8859-1,utf-8;q=0.7,*;q=0.7",
}

enum AcceptEncoding {
  GzipDeflate = "gzip, deflate",
}

enum AcceptLanguage {
  EnUsEnQ05 = "en-us,en;q=0.5",
}

enum Protocol {
  HTTPS = "https",
}

interface Subtitles {
}

interface Thumbnail {
  height:     number;
  url:        string;
  width:      number;
  resolution: string;
  id:         string;
}
