import { exec } from "child_process";
import { EmbedField } from "discord.js";
import * as HttpsProxyAgent from "https-proxy-agent";
import * as ytdl from "ytdl-core";
import m3u8stream from "m3u8stream";
import { DownloadText, log, timer } from "../Util";
import { AudioSource } from "./audiosource";
import { PassThrough, Readable } from "stream";

export class YouTube extends AudioSource {
  // サービス識別子（固定）
  protected _serviceIdentifer = "youtube";
  protected _lengthSeconds = 0;
  private fallback = false;
  private ytdlInfo = null as ytdl.videoInfo;
  private youtubeDlInfo = null as YoutubeDlInfo;
  ChannelName:string;
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
      this.Thumnail = prefetched.thumbnail;
      this.LiveStream = prefetched.isLive;
    }else{
      try{
        const agent = process.env.PROXY && HttpsProxyAgent.default(process.env.PROXY);
        let info = null as ytdl.videoInfo;
        const t = timer.start("YouTube(AudioSource)#init->GetInfo");
        if(process.env.PROXY){
          info = await ytdl.getInfo(url, {
            lang: "ja",
            requestOptions: {agent}
          });
        }else{
          info = await ytdl.getInfo(url, {
            lang: "ja"
          });
        }
        t.end();
        if(forceCache){
          this.ytdlInfo = info;
        }
        this.Title = info.videoDetails.title;
        this.Description = info.videoDetails.description;
        this._lengthSeconds = Number(info.videoDetails.lengthSeconds ?? 0);
        this.ChannelName = info.videoDetails.ownerChannelName;
        this.Thumnail = info.videoDetails.thumbnails[0].url;
        this.LiveStream = info.videoDetails.isLiveContent;
        this.fallback = false;
      }
      catch{
        this.fallback = true;
        log("ytdl.getInfo() failed, fallback to youtube-dl", "warn");
        const t = timer.start("YouTube(AudioSource)#init->GetInfo(Fallback)");
        const info = JSON.parse(await getYouTubeDlInfo(this.Url)) as YoutubeDlInfo;
        t.end();
        if(forceCache){
          this.youtubeDlInfo = info;
        }
        this.LiveStream = info.is_live;
        this.Title = info.title;
        this.Description = info.description;
        this._lengthSeconds = Number(info.duration);
        this.ChannelName = info.channel;
        this.Thumnail = info.thumbnail;
      }
    }
    return this;
  }

  async fetch(){
    try{
      let info = this.ytdlInfo;
      let agent = process.env.PROXY && HttpsProxyAgent.default(process.env.PROXY);
      if(!info){
        const t = timer.start("YouTube(AudioSource)#fetch->GetInfo");
        if(process.env.PROXY){
          info = await ytdl.getInfo(this.Url, {
            requestOptions: {agent},
            lang: "ja"
          });
        }else{
          info = await ytdl.getInfo(this.Url, {
            lang: "ja"
          });
        }
        t.end();
      }
      this.relatedVideos = info.related_videos.map(video => {
        return {
          url: "https://www.youtube.com/watch?v=" + video.id,
          title: video.title,
          description: "関連動画として取得したため詳細は表示されません",
          length: video.length_seconds,
          channel: (video.author as ytdl.Author).name,
          thumbnail: video.thumbnails[0].url,
          isLive: video.isLive
        }
      }).filter(v => !v.isLive);
      this.Description = info.videoDetails.description ?? "不明";
      if(info.videoDetails.title) this.Title = info.videoDetails.title;
      const format = ytdl.chooseFormat(info.formats, {
        filter: this.LiveStream ? null : "audioonly",
        quality: this.LiveStream ? null : "highestaudio",
        isHLS: this.LiveStream,
      } as any);
      let readable = null as Readable;
      if(process.env.PROXY){
        readable = ytdl.downloadFromInfo(info, {
          format: format,
          requestOptions: {agent},
          lang: "ja"
        });
      }else{
        readable = ytdl.downloadFromInfo(info, {
          format: format,
          lang: "ja"
        });
      }
      this.fallback = false;
      return readable;
    }
    catch{
      this.fallback = true;
      log("ytdl.getInfo() failed, fallback to youtube-dl", "warn");
      const t = timer.start("YouTube(AudioSource)#fetch->GetInfo(Fallback)");
      const info = this.youtubeDlInfo ?? JSON.parse(await getYouTubeDlInfo(this.Url)) as YoutubeDlInfo;
      t.end();
      this.Description = info.description ?? "不明";
      if(info.title) this.Title = info.title;
      if(info.is_live){
        const format = info.formats.filter(f => f.format_id === info.format_id);
        const stream = new PassThrough({
          highWaterMark: 1024 * 512
        });
        stream._destroy = () => { stream.destroyed = true };
        const req = m3u8stream(format[0].url, {
          begin: Date.now(),
          parser: "m3u8"
        });
        req.on("error", (e)=>{
          stream.emit("error",e);
        }).pipe(stream).on('error', (e)=> {
          stream.emit("error",e);
        });
        return stream;
      }else{
        const format = info.formats.filter(f => f.format_note==="tiny");
        format.sort((fa, fb) => fb.abr - fa.tbr);
        return format[0].url;
      }
    }
  }

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
      thumbnail: this.Thumnail,
      isLive: this.LiveStream
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
  thumbnail:string;
  isLive:boolean
}

function execAsync(command:string):Promise<string>{
  return new Promise((resolve, reject) => {
    try{
      exec(command, (error, stdout, stderr) => {
        if(error){
          reject(stderr);
        }else{
          resolve(stdout);
        }
      });
    }
    catch(e){
      log(e, "error");
      reject("Main library threw an error and fallback library also threw an error");
    }
  });
}

async function getYouTubeDlInfo(url:string):Promise<Promise<string>>{
  try{
    const dlbinary = async (ver:string)=>{
      const releases = JSON.parse(await DownloadText("https://api.github.com/repos/ytdl-org/youtube-dl/releases/latest", {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Discord-SimpleMusicBot"
      })) as GitHubRelease;
      if(ver !== releases.tag_name){
        await execAsync("curl -L -o \"youtube-dl" + (process.platform === "win32" ? ".exe" : "") + "\" " + releases.assets.filter(a => a.name === (process.platform === "win32" ? "youtube-dl.exe" : "youtube-dl"))[0].browser_download_url);
        if(process.platform !== "win32"){
          await execAsync("chmod 777 youtube-dl");
        }
      }
      ytdlUpdateCheck.last = new Date();
    }
    let version = "";
    try{
      const buf = await execAsync("." + (process.platform === "win32" ? "\\" : "/") + "youtube-dl --version");
      version = buf.trim();
    }
    catch(e){
      await dlbinary("");
    }
    if(new Date().getTime() - ytdlUpdateCheck.last.getTime() >= 1000 * 60 /*1sec*/ * 60 /*1min*/ * 60 /*1hour*/ * 3){
      await dlbinary(version);
    }
    return execAsync("." + (process.platform === "win32" ? "\\" : "/") + "youtube-dl --skip-download --print-json \"" + url + "\"");
  }
  catch(e){
    throw "Main library threw an error and fallback library was not found or occurred an error";
  }
}

class ytdlUpdateCheckData {
  last:Date = new Date(0);
}
const ytdlUpdateCheck = new ytdlUpdateCheckData();

// QuickType of youtube-dl json
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


// QuickType of GitHub Releases API
interface GitHubRelease {
  url:              string;
  assets_url:       string;
  upload_url:       string;
  html_url:         string;
  id:               number;
  author:           Author;
  node_id:          string;
  tag_name:         string;
  target_commitish: TargetCommitish;
  name:             string;
  draft:            boolean;
  prerelease:       boolean;
  created_at:       string;
  published_at:     string;
  assets:           Asset[];
  tarball_url:      string;
  zipball_url:      string;
  body:             string;
  reactions?:       Reactions;
}

export interface Asset {
  url:                  string;
  id:                   number;
  node_id:              string;
  name:                 string;
  label:                string;
  uploader:             Author;
  content_type:         ContentType;
  state:                State;
  size:                 number;
  download_count:       number;
  created_at:           string;
  updated_at:           string;
  browser_download_url: string;
}

export enum ContentType {
  ApplicationOctetStream = "application/octet-stream",
  ApplicationPGPSignature = "application/pgp-signature",
  ApplicationXTar = "application/x-tar",
}

export enum State {
  Uploaded = "uploaded",
}

export interface Author {
  login:               any;
  id:                  number;
  node_id:             any;
  avatar_url:          string;
  gravatar_id:         string;
  url:                 string;
  html_url:            string;
  followers_url:       string;
  following_url:       any;
  gists_url:           any;
  starred_url:         any;
  subscriptions_url:   string;
  organizations_url:   string;
  repos_url:           string;
  events_url:          any;
  received_events_url: string;
  type:                Type;
  site_admin:          boolean;
}

enum Type {
  User = "User",
}

interface Reactions {
  url:         string;
  total_count: number;
  "+1":        number;
  "-1":        number;
  laugh:       number;
  hooray:      number;
  confused:    number;
  heart:       number;
  rocket:      number;
  eyes:        number;
}

enum TargetCommitish {
  Master = "master",
}
